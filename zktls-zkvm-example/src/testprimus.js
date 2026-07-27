import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk"

// Initialize parameters.
const primusZKTLS = new PrimusZKTLS();
const appId = import.meta.env.VITE_APP_ID;
const appSecret = import.meta.env.VITE_APP_SECRET;
const userAddress = "0x810b7bacEfD5ba495bB688bbFD2501C904036AB7"; // 0x...
const attTemplateID = "67ed246d-ff00-47d5-9026-5ff09cbdd65b";
//const initAttestaionResult = await primusZKTLS.init(appId, appSecret);

// ---------------------------------------------------------------------------
// Brevis ZK Credit (zkVM) settings
// ---------------------------------------------------------------------------
const ZK_ID_BASE_URL = "https://zk-id.brevis.network/v1";

// Route under test: Binance avg_balance. The guest parses the WHOLE attested response
// in-circuit (no pre-extracted reveal fields).
// NOTE: placeholder identityPropertyId - replace when the canonical id is assigned.
const IDENTITY_PROPERTY_ID =
    "0xa55e7ba1a55e7ba1a55e7ba1a55e7ba1a55e7ba1a55e7ba1a55e7ba1a55e7ba1";
const APP_ID = "0x36013dd48b0c1fbfe8906c0af0ce521dda69186ab6e6b5017dbf9691f9cf8e5c";

// The user is identified by a Kaito account id. There is NO wallet in this flow.
const KAITO_ID = "kaito-user-" + Date.now();

// If it is running on a mobile terminal, you need to pass the platform parameter. The default platform is PC. If you add the following configuration, it can run on both PC and mobile terminals.
let platformDevice = "pc";
if (navigator.userAgent.toLocaleLowerCase().includes("android")) {
    platformDevice = "android";
} else if (navigator.userAgent.toLocaleLowerCase().includes("iphone")) {
    platformDevice = "ios";
}
const initAttestaionResult = await primusZKTLS.init(appId, appSecret, {platform: platformDevice});
console.log("primusProof initAttestaionResult=", initAttestaionResult);

export async function primusProofTest() {
    // Generate attestation request.
    const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);

    // Complete-response mode: the attestor puts the AES-CTR ciphertext of the ENTIRE HTTP
    // response inside the SIGNED public_data.data (CompleteHttpResponseCiphertext), and hands
    // the AES key back out-of-band. This is what lets the zkVM guest decrypt and parse the raw
    // website data in-circuit.
    //
    // Do NOT use allJsonResponse for this: it carries the same JSON but sits OUTSIDE the signed
    // preimage, so it is not attested and must never be fed to the zkVM.
    request.setComputeMode("nonecomplete");

    // Transfer request object to string.
    const requestStr = request.toJsonString();

    // Sign request.
    const signedRequestStr = await primusZKTLS.sign(requestStr);

    // Start attestation process.
    const attestation = await primusZKTLS.startAttestation(signedRequestStr);
    console.log("attestation=", attestation);

    // Verify siganture.
    const verifyResult = await primusZKTLS.verifyAttestation(attestation)
    console.log("verifyResult=", verifyResult);

    if (verifyResult === true) {
        // AES key for the complete-response ciphertext (out-of-band, not part of the signature).
        const extendedData = JSON.parse(primusZKTLS.getExtendedData(request.requestid));
        const aesKey = JSON.parse(extendedData.CompleteHttpResponseCiphertext).packets[0].aes_key;
        console.log("aesKey=", aesKey);

        // ---- zkVM: prove over the attested raw response ----
        await proveWithZkVm(attestation, aesKey);
    } else {
        // If failed, define your own logic.
    }
}

/**
 * Submit the attestation to the Brevis ZK Credit gateway and poll until the zkVM proof is ready.
 */
async function proveWithZkVm(attestation, aesKey) {
    console.log("%c[zkVM] 1/4 building proof request", "color:#0a7");

    const body = {
        appId: APP_ID,
        identityPropertyId: IDENTITY_PROPERTY_ID,
        zkTlsProof: {
            public_data: attestation,
            // IMPORTANT: private_data must be an ARRAY. The zkVM deserializes it as a sequence;
            // an object ({ aes_key }) fails with "invalid type: map, expected a sequence".
            private_data: [{ aes_key: aesKey }],
        },
        businessParams: { kaito_id: KAITO_ID },
    };
    console.log("[zkVM] request body=", body);

    console.log("%c[zkVM] 2/4 POST " + ZK_ID_BASE_URL + "/proof-requests", "color:#0a7");
    let accepted;
    try {
        const res = await fetch(`${ZK_ID_BASE_URL}/proof-requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        accepted = await res.json();
    } catch (err) {
        console.error("[zkVM] submit failed:", err);
        return;
    }
    if (!accepted || !accepted.proofRequestId) {
        console.error("[zkVM] submit rejected:", accepted && accepted.error);
        return;
    }
    console.log("[zkVM] accepted proofRequestId=", accepted.proofRequestId,
                "status=", accepted.status);

    console.log("%c[zkVM] 3/4 proving (polling every 5s)...", "color:#0a7");
    const started = Date.now();
    const terminal = ["completed", "failed", "prover_failed", "packaging_failed",
                      "submission_failed", "internal_error"];

    return new Promise((resolve) => {
        const timer = setInterval(async () => {
            let details;
            try {
                const res = await fetch(`${ZK_ID_BASE_URL}/proof-requests/${accepted.proofRequestId}`);
                details = await res.json();
            } catch (err) {
                console.log("[zkVM] poll error:", err);
                return;
            }

            const elapsed = ((Date.now() - started) / 1000).toFixed(0);
            console.log(`[zkVM] status=${details.status} (${elapsed}s)`);
            if (!terminal.includes(details.status)) return;

            clearInterval(timer);
            if (details.status !== "completed") {
                console.error("[zkVM] proving failed:", details.failure);
                resolve(details);
                return;
            }

            console.log("%c[zkVM] 4/4 proof received", "color:#0a7;font-weight:bold");
            console.log("[zkVM] proof bytes=", details.proof ? atob(details.proof).length : 0);
            logPublicValues(details);
            resolve(details);
        }, 5000);
    });
}

/**
 * Decode the ABI-encoded publicValues the guest committed to, so the proven result is visible
 * in the console rather than just base64.
 *
 * Layout (AttestationPublicInputs, Kaito variant - no wallet):
 *   word0                  top-level tuple offset (0x20)
 *   tuple head[0]          kaitoId offset (dynamic string)
 *   tuple head[1]          providerId          (bytes32)
 *   tuple head[2]          web2IdNullifier     (bytes32)
 *   tuple head[3]          identityProperty    (bytes32)
 *   tuple head[4]          timestamp           (uint64)
 *   tuple head[5]          dataBlob offset     (dynamic bytes)
 */
function logPublicValues(details) {
    const b64 = details.publicValues && details.publicValues.publicValues;
    if (!b64) {
        console.log("[zkVM] publicValues=", details.publicValues);
        return;
    }
    const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const word = (off) => raw.slice(off, off + 32);
    const num = (off) => {
        let v = 0n;
        for (const b of word(off)) v = (v << 8n) | BigInt(b);
        return v;
    };
    const hex = (off) =>
        "0x" + [...word(off)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const text = (off, len) => new TextDecoder().decode(raw.slice(off, off + len));

    const t = 32; // tuple begins after the top-level offset word
    const kaitoOff = t + Number(num(t));
    const kaitoLen = Number(num(kaitoOff));
    const blobOff = t + Number(num(t + 160));
    const blobLen = Number(num(blobOff));
    const blob = raw.slice(blobOff + 32, blobOff + 32 + blobLen);

    // dataBlob is abi tuple(uint256 averageBalanceUsdtCents, uint256 sampleCount)
    const bnum = (arr, off) => {
        let v = 0n;
        for (const b of arr.slice(off, off + 32)) v = (v << 8n) | BigInt(b);
        return v;
    };
    const inner = Number(bnum(blob, 0));
    const avgCents = bnum(blob, inner);
    const sampleCount = bnum(blob, inner + 32);

    console.log("[zkVM] --- proven public values ---");
    console.log("[zkVM]   providerId       =", hex(t + 32));
    console.log("[zkVM]   web2IdNullifier  =", hex(t + 64));
    console.log("[zkVM]   identityProperty =", hex(t + 96));
    console.log("[zkVM]   timestamp        =", num(t + 128).toString());
    console.log("[zkVM]   kaitoId          =", text(kaitoOff + 32, kaitoLen));
    console.log("[zkVM]   averageBalance   =", (Number(avgCents) / 100).toFixed(2), "USDT",
                `(${avgCents} cents)`);
    console.log("[zkVM]   sampleCount      =", sampleCount.toString(),
                "daily entries parsed in-circuit");
}
