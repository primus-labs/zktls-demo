// agentGuard.test.js
//
// Offline tests for the agent-side guard. These use synthetic attestation
// objects so they run without Primus credentials or network access:
//
//   node agentGuard.test.js
//
// They document what the guard accepts and rejects. Signature verification is
// out of scope here - it is done by zkTLS.verifyAttestation before the guard.

import assert from "node:assert";
import {
  guardAttestation,
  checkFreshness,
  checkSchema,
  attestationNullifier,
  NullifierStore,
  AttestationGuardError,
} from "./agentGuard.js";

const ENDPOINT = "https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=BTC-USD";
const PARSE_PATH = "$.data[0].instType";

// Fixed reference clock (ms).
const NOW = 1_800_000_000_000;

function sampleAttestation(overrides = {}) {
  return {
    recipient: "0x000000000000000000000000000000000000b0b",
    request: { url: ENDPOINT, header: "", method: "GET", body: "" },
    reponseResolve: [{ keyName: "instType", parseType: "json", parsePath: PARSE_PATH }],
    data: '{"instType":"SPOT"}',
    attConditions: "",
    timestamp: NOW, // ms
    additionParams: "",
    signatures: ["0xdeadbeef"],
    ...overrides,
  };
}

function basePolicy(extra = {}) {
  return {
    maxAgeMs: 30_000,
    clockSkewMs: 5_000,
    schema: { url: ENDPOINT, method: "GET", parsePaths: [PARSE_PATH] },
    now: NOW,
    ...extra,
  };
}

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ok  ${name}`);
    passed += 1;
  } catch (e) {
    console.error(`FAIL  ${name}`);
    console.error("      ", e.message);
    process.exitCode = 1;
  }
}

async function expectReject(reason, fn) {
  try {
    await fn();
    throw new Error(`expected rejection with reason ${reason}, but it passed`);
  } catch (e) {
    assert.ok(e instanceof AttestationGuardError, `expected AttestationGuardError, got ${e}`);
    assert.strictEqual(e.reason, reason, `expected reason ${reason}, got ${e.reason}`);
  }
}

const run = async () => {
  console.log("agentGuard tests");

  // --- freshness ---

  await test("accepts a fresh attestation", async () => {
    const att = sampleAttestation({ timestamp: NOW - 10_000 });
    const res = await guardAttestation(att, basePolicy({ nullifierStore: new NullifierStore() }));
    assert.strictEqual(res.ok, true);
  });

  await test("rejects a stale attestation", async () => {
    const att = sampleAttestation({ timestamp: NOW - 60_000 }); // 60s old, max 30s
    await expectReject("STALE", () => guardAttestation(att, basePolicy()));
  });

  await test("rejects a future-dated attestation", async () => {
    const att = sampleAttestation({ timestamp: NOW + 60_000 });
    await expectReject("FUTURE", () => guardAttestation(att, basePolicy()));
  });

  await test("tolerates small clock skew", async () => {
    const att = sampleAttestation({ timestamp: NOW + 3_000 }); // within 5s skew
    await checkFreshness(att, { maxAgeMs: 30_000, clockSkewMs: 5_000, now: NOW });
  });

  await test("maxAgeMs=0 disables the age check", async () => {
    const att = sampleAttestation({ timestamp: NOW - 365 * 24 * 3600 * 1000 });
    await checkFreshness(att, { maxAgeMs: 0, now: NOW });
  });

  await test("normalizes second-precision timestamps", async () => {
    const att = sampleAttestation({ timestamp: Math.floor(NOW / 1000) - 5 }); // seconds
    await checkFreshness(att, { maxAgeMs: 30_000, now: NOW });
  });

  // --- schema ---

  await test("rejects a mismatched endpoint", async () => {
    const att = sampleAttestation({
      request: { url: "https://evil.example.com/price", method: "GET", body: "", header: "" },
      timestamp: NOW,
    });
    await expectReject("SCHEMA_MISMATCH", () => guardAttestation(att, basePolicy()));
  });

  await test("rejects a mismatched method", async () => {
    const att = sampleAttestation({
      request: { url: ENDPOINT, method: "POST", body: "", header: "" },
    });
    await expectReject("SCHEMA_MISMATCH", () =>
      checkSchema(att, { url: ENDPOINT, method: "GET" })
    );
  });

  await test("rejects missing parse paths", async () => {
    const att = sampleAttestation({
      reponseResolve: [{ keyName: "x", parseType: "json", parsePath: "$.data[0].other" }],
    });
    await expectReject("SCHEMA_MISMATCH", () =>
      checkSchema(att, { parsePaths: [PARSE_PATH] })
    );
  });

  // --- replay ---

  await test("rejects a replayed attestation", async () => {
    const store = new NullifierStore();
    const att = sampleAttestation({ timestamp: NOW - 5_000 });
    const policy = basePolicy({ nullifierStore: store });
    await guardAttestation(att, policy); // first use ok
    await expectReject("REPLAY", () => guardAttestation(att, basePolicy({ nullifierStore: store })));
  });

  await test("distinct attestations get distinct nullifiers", async () => {
    const a1 = sampleAttestation({ timestamp: NOW - 5_000 });
    const a2 = sampleAttestation({ timestamp: NOW - 4_000 });
    const n1 = await attestationNullifier(a1);
    const n2 = await attestationNullifier(a2);
    assert.notStrictEqual(n1, n2);
  });

  await test("nullifier is stable across identical objects", async () => {
    const a1 = sampleAttestation({ timestamp: NOW - 5_000 });
    const a2 = sampleAttestation({ timestamp: NOW - 5_000 });
    const n1 = await attestationNullifier(a1);
    const n2 = await attestationNullifier(a2);
    assert.strictEqual(n1, n2);
  });

  console.log(`\n${passed} passed`);
};

run();
