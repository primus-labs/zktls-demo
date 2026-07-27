import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk"

// Initialize parameters.
const primusZKTLS = new PrimusZKTLS();
const appId = import.meta.env.VITE_APP_ID;
const appSecret = import.meta.env.VITE_APP_SECRET;
const userAddress = "0x810b7bacEfD5ba495bB688bbFD2501C904036AB7"; // 0x...
const attTemplateID = "88c4e005-9e53-4e97-ab56-1c3490f505fa";

//const initAttestaionResult = await primusZKTLS.init(appId, appSecret);

// ---------------------------------------------------------------------------
// Brevis ZK Credit (zkVM) settings
// ---------------------------------------------------------------------------
const ZK_ID_BASE_URL = "https://zk-id.brevis.network/v1";

// Route under test: Binance wallet_balance (raw whole-response reveal). The attestation
// reveals the ENTIRE HTTP body via the root selector, bound to the signature by
// sha256(content||salt). The guest re-hashes and parses $.data[] in-circuit - no AES
// decryption, so private_data carries {id, salt, content} instead of an aes_key.
// NOTE: placeholder identityPropertyId - replace when the canonical id is assigned.
const IDENTITY_PROPERTY_ID =
    "0xb0117a11ce570b0117a11ce570b0117a11ce570b0117a11ce570b0117a11ce57";
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

    const attConditions = [
     [
      {
        field:'data',
        op:'SHA256_WITH_SALT',
      },
     ],
    ];
    request.setAttConditions(attConditions);

    request.setAllJsonResponseFlag('true');
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
        // public_data = the signed attestation (logged above).
        //
        // private_data = the plaintext behind the salted-hash reveal. It comes back split
        // across two SDK getters, matched by reveal id:
        //   getAllJsonResponse -> [{ id, content }]  (the whole HTTP body)
        //   getPrivateData     -> [{ id, salt }]     (the per-field salt)
        // The zkVM re-computes sha256(content||salt) and checks it equals the signed
        // public_data.data hash, so both halves are required and must line up by id.
        const plainRes = primusZKTLS.getAllJsonResponse(request.requestid);
        console.log("plainRes=", plainRes);

        const privateRes = primusZKTLS.getPrivateData(request.requestid);
        console.log("privateRes=", privateRes);

        const privateData = buildPrivateData(plainRes, privateRes);
        console.log("privateData=", privateData);

        // ---- zkVM: prove over the attested raw response ----
        await proveWithZkVm(attestation, privateData);
    } else {
        // If failed, define your own logic.
    }
}

/**
 * Merge the SDK's two private-data halves into the shape the zkVM expects:
 *   [{ id, salt, content: [<whole body>] }]
 * salt comes from getPrivateData, content from getAllJsonResponse, matched by reveal id.
 */
function buildPrivateData(plainRes, privateRes) {
    const saltFor = (id) => {
        if (Array.isArray(privateRes)) {
            const hit = privateRes.find((p) => p && p.id === id);
            return hit && (hit[id] ?? hit.salt);
        }
        // getPrivateData returns an object keyed by reveal id: { "<id>": "<salt hex>" }
        return privateRes && privateRes[id];
    };
    return (plainRes || []).map(({ id, content }) => ({
        id,
        salt: saltFor(id),
        content: Array.isArray(content) ? content : [content],
    }));
}

/**
 * Submit the attestation to the Brevis ZK Credit gateway and poll until the zkVM proof is ready.
 */
async function proveWithZkVm(attestation, privateData) {
    console.log("%c[zkVM] 1/4 building proof request", "color:#0a7");

    const body = {
        appId: APP_ID,
        identityPropertyId: IDENTITY_PROPERTY_ID,
        zkTlsProof: {
            public_data: attestation,
            // private_data must be a SEQUENCE: [{ id, salt, content: [...] }]. The zkVM
            // deserializes it as an array; a bare object fails with
            // "invalid type: map, expected a sequence".
            private_data: privateData,
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

    // dataBlob is abi tuple(uint256 totalValuationUsdtCents, uint256 assetCount)
    const bnum = (arr, off) => {
        let v = 0n;
        for (const b of arr.slice(off, off + 32)) v = (v << 8n) | BigInt(b);
        return v;
    };
    const inner = Number(bnum(blob, 0));
    const totalCents = bnum(blob, inner);
    const assetCount = bnum(blob, inner + 32);

    console.log("[zkVM] --- proven public values ---");
    console.log("[zkVM]   providerId       =", hex(t + 32));
    console.log("[zkVM]   web2IdNullifier  =", hex(t + 64));
    console.log("[zkVM]   identityProperty =", hex(t + 96));
    console.log("[zkVM]   timestamp        =", num(t + 128).toString());
    console.log("[zkVM]   kaitoId          =", text(kaitoOff + 32, kaitoLen));
    console.log("[zkVM]   totalBalance     =", (Number(totalCents) / 100).toFixed(2), "USDT",
                `(${totalCents} cents)`);
    console.log("[zkVM]   assetCount       =", assetCount.toString(),
                "assets summed in-circuit");
}
