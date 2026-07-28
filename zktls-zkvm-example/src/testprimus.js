import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk"

// Initialize parameters.
const primusZKTLS = new PrimusZKTLS();
const appId = import.meta.env.VITE_APP_ID;
const appSecret = import.meta.env.VITE_APP_SECRET;
// The attestation `recipient`. Set this to your own address before running.
//
// NOTE: it is supplied by the caller, so it is NOT a Binance account identifier. The nullifier is
// derived from the attested `userId` instead — keying it on `recipient` would let one Binance
// account mint unlimited distinct nullifiers just by varying this value.
const userAddress = import.meta.env.VITE_RECIPIENT_ADDRESS
    || "0x0000000000000000000000000000000000000000";

// Four-request template (Primus-provided; not editable on our side). One attestation covers all
// four requests, so there is a single signature over the whole set.
const attTemplateID = "62df67c2-2ef7-45ca-bf67-72bdce5dc54b";

/**
 * Per-request body params for template 62df67c2-…, which has FOUR requests. Slots 0 and 1 take no
 * override; slots 2 and 3 are the paginated history feeds and need an explicit window + page.
 *
 * Mirrors the reference snippet, minus dayjs: window is [UTC midnight 30 days ago,
 * UTC end of today]. `limit` maxes out at 200.
 */
function buildAdditionParams() {
    const now = new Date();
    const endTime = Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999);
    const back = new Date(endTime);
    back.setUTCDate(back.getUTCDate() - 30);
    const startTime = Date.UTC(
        back.getUTCFullYear(), back.getUTCMonth(), back.getUTCDate(), 0, 0, 0, 0);

    const pageWindow = {
        bodyParams: {
            startTime,                       // startTime ~ endTime, max span 30 days
            endTime,
            page: { limit: 200, offset: 0 }, // limit max = 200
        },
    };
    console.log("[capture] window =", new Date(startTime).toISOString(), "->",
                new Date(endTime).toISOString(),
                `(${((endTime - startTime + 1) / 86400000).toFixed(4)} days)`);
    // Slots 0 and 1 are left untouched; only the two paginated requests are parameterised.
    return JSON.stringify({ needUpdateRequests: [undefined, undefined, pageWindow, pageWindow] });
}

/**
 * Template 62df67c2-… has FOUR requests. Their URLs, data-item names and response shapes are not
 * known here yet — the first capture reports all of them (see inspectReveals/describeBody).
 *
 * Known from the reference snippet: slots 2 and 3 are paginated feeds taking
 * `{startTime, endTime, page:{limit,offset}}` with limit max 200 and a span cap of 30 days, so
 * they are almost certainly the deposit and withdraw histories. Slots 0 and 1 take no body params.
 *
 * `attConditions[i].field` must equal request i's data-item name. Every template seen so far uses
 * `root` (jsonPath `$`); a wrong name is dropped SILENTLY and the template default applies.
 */
const REVEALS = [
    { id: "userId", path: "$.data.userId", note: "scalar string - nullifier source" },
    { id: "tokenList", path: "$.data", note: "array of holdings: asset, amount, valuationAmount" },
    { id: "depositList", path: "$.data.rows", note: "array: transferAmount, insertTime, coin, status" },
    { id: "withdrawList", path: "$.data.rows", note: "array: transferAmount, transactionFee, applyTime, symbol, status" },
];

//const initAttestaionResult = await primusZKTLS.init(appId, appSecret);

// ---------------------------------------------------------------------------
// Brevis ZK Credit (zkVM) settings
// ---------------------------------------------------------------------------
const ZK_ID_BASE_URL = "https://zk-id.brevis.network/v1";

// Route under test: binance.avg_balance.v1 — 31-day time-weighted average balance from the
// four-request template. The guest verifies all four salted-hash reveals, re-derives the window
// from the SIGNED POST bodies, and reconstructs the balance backwards from the tokenList snapshot.
// Guest: brevis-zkcredit vm/app/src/providers/binance/avg_balance_v1/mod.rs
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

    // The paginated requests need their window + page set before signing.
    request.setAdditionParams(buildAdditionParams());

    // setAttConditions takes an ARRAY OF ARRAYS: one inner array per template request, in template
    // order. Four requests need four inner arrays, or the later ones get no reveal condition.
    //
    // `field` must equal the template's DATA-ITEM NAME. Every template seen so far names it
    // `root` (jsonPath `$`), so that is the assumption here -- but a non-matching name is dropped
    // SILENTLY and the template default applies instead. inspectReveals() reports the reveal ids
    // and ops that actually came back, so a wrong guess shows up immediately rather than as a
    // confusing verification failure later.
    const attConditions = REVEALS.map((r) => [{ field: r.id, op: "SHA256_WITH_SALT" }]);
    console.log("attConditions=", attConditions);
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

        const privateData = buildPrivateData(attestation, plainRes, privateRes);
        console.log("privateData=", privateData);

        // Cheap local equivalent of the guest's binding check.
        await verifyRevealHashes(attestation, privateData);

        // Dump the three reveals in a readable form. Several facts we still need in order to
        // finish the guest can only come from a REAL multi-request response, so this runs before
        // (and independently of) the proving step.
        inspectReveals(attestation, privateData);

        // ---- zkVM: prove over the attested raw response ----
        await proveWithZkVm(attestation, privateData);
    } else {
        // If failed, define your own logic.
    }
}

/**
 * Print each reveal decoded, plus the request URLs and negotiated ops.
 *
 * Everything here comes from the SIGNED public_data, so it doubles as a preview of what the guest
 * will see. Reveals are classified by CONTENT SHAPE rather than by name, because a template's
 * data-item names are not knowable up front.
 */
function inspectReveals(attestation, privateData) {
    let signed = {};
    try { signed = JSON.parse(attestation?.data || "{}"); } catch { /* leave empty */ }
    const conditions = (() => {
        try { return JSON.parse(attestation?.attConditions || "[]"); } catch { return []; }
    })();
    const opOf = Object.fromEntries(conditions.map((c) => [c.reveal_id, c.op]));
    const byId = Object.fromEntries((privateData || []).map((p) => [p.id, p]));

    console.log("%c[capture] --- reveals ---", "color:#07a;font-weight:bold");

    // Every request URL. requests[0] is in request.url; the rest are in additionParams under
    // requests[N].url, and requests[N].body carries the POST params. Both are signed.
    console.log("[capture] requests[0].url =", attestation?.request?.url);
    let extra = {};
    try { extra = JSON.parse(attestation?.additionParams || "{}"); } catch { /* ignore */ }
    for (const k of Object.keys(extra).sort()) {
        if (/^requests\[\d+\]\.(url|body)$/.test(k)) {
            console.log(`[capture] ${k} =`, String(extra[k]).slice(0, 260));
        }
    }
    console.log("[capture] attested timestamp =", attestation?.timestamp);
    console.log("[capture] reveal ids =", Object.keys(signed), " ops =", opOf);

    // We request SHA256_WITH_SALT. If `field` does not match a template data-item name the
    // condition is dropped WITHOUT ERROR and the template default applies instead, so assert the
    // negotiated op rather than discovering the fallback later.
    const wrongOp = Object.entries(opOf).filter(([, op]) => op !== "REVEAL_SALTTED_HASH");
    if (wrongOp.length) {
        console.error(`%c[capture] op mismatch: requested SHA256_WITH_SALT but got `
            + wrongOp.map(([id, op]) => `${id}=${op}`).join(", ")
            + `. That condition was dropped -- \`field\` must equal the template's data-item name.`,
            "color:#c00;font-weight:bold");
    }

    for (const [id, val] of Object.entries(signed)) {
        // Salted hash: the signed value is a hash and the plaintext is in private_data.
        const raw = opOf[id] === "REVEAL_SALTTED_HASH" ? byId[id]?.content?.[0] : val;
        let body;
        try { body = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { body = raw; }
        if (body === undefined) {
            console.log(`[capture] reveal "${id}": no content resolved (hash only) =`, val);
            continue;
        }
        console.log(`%c[capture] reveal "${id}" (${opOf[id] || "?"})`, "font-weight:bold");
        describeBody(body);
    }
    console.log("%c[capture] --- end reveals ---", "color:#07a;font-weight:bold");
}

/**
 * Summarise one reveal by CONTENT SHAPE, printing the fields the guest depends on.
 */
function describeBody(body) {
    // Reveals are narrowed by the template's parsePath, so a reveal is typically a bare array
    // ($.data / $.data.rows) or a bare scalar ($.data.userId) -- not a {data:…} envelope.
    if (body === null || typeof body !== "object") {
        console.log("[capture]   shape=SCALAR  value =", body);
        return;
    }
    const d = Array.isArray(body) ? body : body.data;

    // asset snapshot
    if (Array.isArray(d) && d.length && d[0].valuationAmount !== undefined) {
        let total = 0;
        console.log(`[capture]   shape=ASSETS  ${d.length} holdings`);
        for (const a of d) {
            const amt = Number(a.amount), val = Number(a.valuationAmount);
            total += val;
            console.log(`[capture]     ${String(a.asset).padEnd(6)}`
                      + ` amount=${String(a.amount).padEnd(18)}`
                      + ` valuation=${String(a.valuationAmount).padEnd(18)}`
                      + ` price=${amt ? (val / amt).toFixed(8) : "n/a"}`);
        }
        console.log("[capture]     snapshot total =", total.toFixed(8), "USDT");
        return;
    }

    // deposit / withdraw feed. NOTE: with parsePath `$.data.rows` the attested value is the ROWS
    // ARRAY ALONE -- `$.data.total` is outside the reveal, so truncation cannot be detected
    // in-circuit. Coverage rests entirely on the pinned page limit/offset.
    const rows = d?.rows ?? d?.list ?? (Array.isArray(d) ? d : undefined);
    if (Array.isArray(rows)) {
        const total = d?.total ?? d?.count;
        console.log(`[capture]   shape=PAGED  rows=${rows.length}  total=${total ?? "NOT REVEALED"}`);
        // Field names differ between the deposit and withdraw feeds.
        const coinOf = (r) => r.coin ?? r.symbol ?? r.asset;
        const timeOf = (r) => r.insertTime ?? r.applyTime ?? r.time;
        const kindOf = (r) => r.type ?? (r.transactionFee !== undefined ? "WITHDRAW" : "DEPOSIT");
        const kinds = {};
        for (const r of rows) {
            const k = `${kindOf(r)}/${r.statusName ?? "?"}`;
            kinds[k] = (kinds[k] || 0) + 1;
        }
        console.log("[capture]     kind/status histogram =", kinds);
        for (const r of rows.slice(0, 12)) {
            const fee = r.transactionFee !== undefined ? ` fee=${r.transactionFee}` : "";
            console.log(`[capture]     ${String(kindOf(r)).padEnd(9)}`
                      + ` ${String(coinOf(r)).padEnd(6)}`
                      + ` amount=${String(r.transferAmount ?? r.amount).padEnd(12)}${fee}`
                      + ` time=${timeOf(r)}`);
        }
        if (rows.length > 12) console.log(`[capture]     … ${rows.length - 12} more`);
        return;
    }

    console.log("[capture]   shape=UNRECOGNISED  top keys =", Object.keys(body || {}));
}

/**
 * Extract the value a reveal's `parsePath` selects, then serialise it the way Primus hashed it.
 *
 * This is the crux: getAllJsonResponse() hands back the WHOLE response body, but the salted hash
 * is computed over the value NARROWED by parsePath ($.data.userId, $.data, $.data.rows). Pairing
 * the full body with the salt produces a hash that does not match the signed one, and the guest
 * rejects every reveal.
 *
 * Verified against a real capture: content is compact JSON in the response's original key order,
 * and a scalar is hashed BARE -- e.g. `123456789`, not `"123456789"`.
 */
function narrowForHash(fullBody, fieldSpec) {
    // `field` is usually the FIELD_ARITHMETIC wrapper carrying the real path.
    let path = fieldSpec;
    try {
        const wrapper = JSON.parse(fieldSpec);
        if (wrapper && typeof wrapper.field === "string") path = wrapper.field;
    } catch { /* already a plain path */ }

    let v = fullBody;
    for (const seg of path.replace(/^\$\.?/, "").split(".").filter(Boolean)) {
        v = v?.[seg];
    }
    // JSON.stringify keeps insertion order and emits no spaces, matching the hashed form.
    // Scalars must NOT be quoted.
    return v === null || typeof v !== "object" ? String(v) : JSON.stringify(v);
}

/**
 * Build the private_data the zkVM expects: [{ id, salt, content: [<narrowed value>] }].
 *
 * `attConditions` is the authority for both the reveal id and its parsePath, and its order matches
 * the request order that getAllJsonResponse() returns bodies in.
 */
function buildPrivateData(attestation, plainRes, privateRes) {
    let conditions = [];
    try { conditions = JSON.parse(attestation?.attConditions || "[]"); } catch { /* none */ }

    const bodyAt = (i, id) => {
        // Prefer an id match; fall back to positional, which is how the two lists line up.
        const hit = Array.isArray(plainRes)
            ? plainRes.find((p) => p && p.id === id) ?? plainRes[i]
            : undefined;
        const raw = hit && (hit.content ?? hit);
        const text = Array.isArray(raw) ? raw[0] : raw;
        try { return JSON.parse(text); } catch { return text; }
    };
    const saltFor = (id) => (Array.isArray(privateRes)
        ? privateRes.find((p) => p && p.id === id)?.salt
        : privateRes?.[id]);

    return conditions.map((c, i) => ({
        id: c.reveal_id,
        salt: saltFor(c.reveal_id),
        content: [narrowForHash(bodyAt(i, c.reveal_id), c.field)],
    }));
}

/**
 * Recompute sha256(content || hex_decode(salt)) for every reveal and compare against the SIGNED
 * public_data.data. The guest performs exactly this check, so a mismatch here means the proof
 * request would be rejected -- far cheaper to catch in the browser than at the prover.
 */
async function verifyRevealHashes(attestation, privateData) {
    let signed = {};
    try { signed = JSON.parse(attestation?.data || "{}"); } catch { /* none */ }

    const enc = new TextEncoder();
    let allOk = true;
    for (const { id, salt, content } of privateData) {
        if (!salt) { console.error(`[hash] ${id}: no salt`); allOk = false; continue; }
        const saltBytes = Uint8Array.from(salt.match(/../g).map((b) => parseInt(b, 16)));
        const body = enc.encode(content[0]);
        const buf = new Uint8Array(body.length + saltBytes.length);
        buf.set(body); buf.set(saltBytes, body.length);
        const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", buf))]
            .map((b) => b.toString(16).padStart(2, "0")).join("");
        const ok = digest === signed[id];
        if (!ok) allOk = false;
        console.log(`%c[hash] ${ok ? "PASS" : "FAIL"} ${id}`,
                    `color:${ok ? "#0a7" : "#c00"};font-weight:bold`,
                    ok ? "" : `\n  computed ${digest}\n  signed   ${signed[id]}`
                             + `\n  content  ${JSON.stringify(content[0]).slice(0, 160)}`);
    }
    console.log(allOk
        ? "%c[hash] all reveals bind to the signed attestation"
        : "%c[hash] MISMATCH - the guest will reject this payload",
        `color:${allOk ? "#0a7" : "#c00"};font-weight:bold`);
    return allOk;
}

/**
 * Submit the attestation to the Brevis ZK Credit gateway and poll until the zkVM proof is ready.
 */
async function proveWithZkVm(attestation, privateData) {
    // The guest for the three-reveal avg-balance route does not exist yet. IDENTITY_PROPERTY_ID
    // still points at wallet_balance, which pins a config with exactly ONE reveal (`data`) and
    // compares attConditions for equality -- so a three-reveal attestation fails closed there
    // rather than producing anything meaningful. Skip proving until the route is built, but keep
    // the capture output above, which is the useful part right now.
    const got = (privateData || []).map((p) => p.id).sort().join(",");
    const want = REVEALS.map((r) => r.id).sort().join(",");
    if (got !== want) {
        console.warn(`%c[zkVM] skipped: attestation has reveals [${got}] but `
            + `binance.avg_balance.v1 expects [${want}].`, "color:#a60;font-weight:bold");
        return;
    }

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

    const bnum = (arr, off) => {
        let v = 0n;
        for (const b of arr.slice(off, off + 32)) v = (v << 8n) | BigInt(b);
        return v;
    };
    // dataBlob is abi tuple(uint256 avgBalanceUsdtCents, uint256 windowMillis,
    // uint256 eventCount) -- THREE PLAIN WORDS. No dynamic members means NO leading offset word:
    // read words 0..2 directly. Treating word0 as an offset indexes out of range and yields 0.
    const avgCents = bnum(blob, 0);
    const windowMs = bnum(blob, 32);
    const eventCount = bnum(blob, 64);

    console.log("[zkVM] --- proven public values ---");
    console.log("[zkVM]   providerId       =", hex(t + 32));
    console.log("[zkVM]   web2IdNullifier  =", hex(t + 64));
    console.log("[zkVM]   identityProperty =", hex(t + 96));
    console.log("[zkVM]   timestamp        =", num(t + 128).toString());
    console.log("[zkVM]   kaitoId          =", text(kaitoOff + 32, kaitoLen));
    console.log("[zkVM]   avgBalance       =", (Number(avgCents) / 100).toFixed(2), "USDT",
                `(${avgCents} cents, time-weighted)`);
    console.log("[zkVM]   window           =", (Number(windowMs) / 86400000).toFixed(4), "days");
    console.log("[zkVM]   eventCount       =", eventCount.toString(),
                "settled movements replayed in-circuit");
}
