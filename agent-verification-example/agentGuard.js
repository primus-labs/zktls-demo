// agentGuard.js
//
// Agent-side checks that run *after* zkTLS.verifyAttestation returns true.
//
// zkTLS.verifyAttestation confirms the attestor signature and that the
// attestation is internally consistent. It does not tell an autonomous agent
// whether the attestation is:
//   - fresh enough to act on,
//   - shaped the way the agent expects (endpoint / response schema),
//   - being replayed from a previous run.
//
// The stock examples end with a comment: "Business logic checks, such as
// attestation content and timestamp checks - do your own business logic."
// This module is a concrete, reusable version of that comment, aimed at
// agents that will act on the data automatically (place an order, sign a tx)
// rather than show it to a human who might notice something is off.
//
// It is transport-agnostic and has no dependencies: pass in the attestation
// object returned by startAttestation.

/**
 * Error thrown when an attestation passes signature verification but fails an
 * agent-side usability check. `reason` is a stable machine-readable code.
 */
export class AttestationGuardError extends Error {
  constructor(reason, message, details = {}) {
    super(message);
    this.name = "AttestationGuardError";
    this.reason = reason; // e.g. "STALE", "FUTURE", "SCHEMA_MISMATCH", "REPLAY"
    this.details = details;
  }
}

/**
 * Parse the attestation timestamp into epoch milliseconds.
 *
 * Primus attestations carry `timestamp` in the same units the on-chain struct
 * uses. In practice SDK builds have emitted this as milliseconds; some emit
 * seconds. We normalize defensively: a 10-digit value is treated as seconds,
 * a 13-digit value as milliseconds.
 *
 * @param {object} attestation
 * @returns {number} epoch milliseconds
 */
export function attestationTimestampMs(attestation) {
  const raw = Number(attestation?.timestamp);
  if (!Number.isFinite(raw) || raw <= 0) {
    throw new AttestationGuardError(
      "NO_TIMESTAMP",
      "Attestation has no usable timestamp",
      { timestamp: attestation?.timestamp }
    );
  }
  // < 1e12 => seconds (10-digit epoch), otherwise milliseconds.
  return raw < 1e12 ? raw * 1000 : raw;
}

/**
 * Reject attestations that are too old or dated in the future.
 *
 * @param {object} attestation
 * @param {object} opts
 * @param {number} opts.maxAgeMs   Maximum accepted age in ms. 0 disables the age check.
 * @param {number} [opts.clockSkewMs=5000] Tolerance for future-dated timestamps.
 * @param {number} [opts.now=Date.now()]   Injectable clock for testing.
 */
export function checkFreshness(attestation, { maxAgeMs, clockSkewMs = 5000, now = Date.now() }) {
  const tsMs = attestationTimestampMs(attestation);
  const age = now - tsMs;

  if (age < -clockSkewMs) {
    throw new AttestationGuardError(
      "FUTURE",
      `Attestation is dated ${-age}ms in the future (beyond ${clockSkewMs}ms skew)`,
      { attestationTimeMs: tsMs, nowMs: now }
    );
  }
  if (maxAgeMs > 0 && age > maxAgeMs) {
    throw new AttestationGuardError(
      "STALE",
      `Attestation age ${age}ms exceeds maxAgeMs ${maxAgeMs}ms`,
      { attestationTimeMs: tsMs, nowMs: now, ageMs: age, maxAgeMs }
    );
  }
  return true;
}

/**
 * Confirm the attestation was produced for the endpoint and response shape the
 * agent expects. A template can keep producing valid proofs after an upstream
 * endpoint silently changes meaning (units, spot vs mark price, aggregation
 * method); pinning the URL and the response parse paths catches the obvious
 * cases of that drift before the data is used.
 *
 * @param {object} attestation
 * @param {object} expected
 * @param {string} [expected.url]            Exact request URL the agent expects.
 * @param {string} [expected.method]         Expected HTTP method.
 * @param {string[]} [expected.parsePaths]   Response parse paths that must all be present.
 */
export function checkSchema(attestation, expected = {}) {
  const request = attestation?.request ?? {};

  if (expected.url !== undefined && request.url !== expected.url) {
    throw new AttestationGuardError(
      "SCHEMA_MISMATCH",
      "Attestation request URL does not match expected endpoint",
      { expected: expected.url, actual: request.url }
    );
  }

  if (expected.method !== undefined) {
    const actualMethod = String(request.method ?? "").toUpperCase();
    if (actualMethod !== String(expected.method).toUpperCase()) {
      throw new AttestationGuardError(
        "SCHEMA_MISMATCH",
        "Attestation request method does not match expected method",
        { expected: expected.method, actual: request.method }
      );
    }
  }

  if (Array.isArray(expected.parsePaths) && expected.parsePaths.length > 0) {
    const resolves = attestation?.reponseResolve ?? attestation?.responseResolve ?? [];
    const actualPaths = new Set(resolves.map((r) => r.parsePath));
    const missing = expected.parsePaths.filter((p) => !actualPaths.has(p));
    if (missing.length > 0) {
      throw new AttestationGuardError(
        "SCHEMA_MISMATCH",
        "Attestation is missing expected response parse paths",
        { missing, actual: [...actualPaths] }
      );
    }
  }

  return true;
}

/**
 * Derive a stable key for an attestation, used for single-use / replay
 * tracking. Built from the fields the attestor signs over so that a
 * bit-for-bit resubmission maps to the same key while genuinely distinct
 * attestations differ.
 *
 * Uses Web Crypto (available in Node 18+ and browsers). Returns a hex string.
 *
 * @param {object} attestation
 * @returns {Promise<string>}
 */
export async function attestationNullifier(attestation) {
  const request = attestation?.request ?? {};
  const resolves = attestation?.reponseResolve ?? attestation?.responseResolve ?? [];
  const material = JSON.stringify({
    recipient: attestation?.recipient ?? "",
    url: request.url ?? "",
    header: request.header ?? "",
    method: request.method ?? "",
    body: request.body ?? "",
    data: attestation?.data ?? "",
    attConditions: attestation?.attConditions ?? "",
    timestamp: attestation?.timestamp ?? "",
    additionParams: attestation?.additionParams ?? "",
    resolves: resolves.map((r) => [r.keyName, r.parseType, r.parsePath]),
    signatures: attestation?.signatures ?? attestation?.signature ?? "",
  });

  const bytes = new TextEncoder().encode(material);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * In-memory single-use store. For production, back this with a database or an
 * on-chain nullifier mapping (see the AttestationGuard.sol pattern in
 * primus-labs/zktls-contracts) so replay protection survives restarts.
 */
export class NullifierStore {
  constructor() {
    this._seen = new Set();
  }
  has(nullifier) {
    return this._seen.has(nullifier);
  }
  add(nullifier) {
    this._seen.add(nullifier);
  }
}

/**
 * Run all agent-side checks. Assumes zkTLS.verifyAttestation(attestation) has
 * already returned true - signature verification is not repeated here.
 *
 * @param {object} attestation
 * @param {object} policy
 * @param {number} policy.maxAgeMs
 * @param {number} [policy.clockSkewMs]
 * @param {object} [policy.schema]       Passed to checkSchema.
 * @param {NullifierStore} [policy.nullifierStore] Enables replay protection when provided.
 * @param {number} [policy.now]          Injectable clock for testing.
 * @returns {Promise<{ ok: true, nullifier: string|null }>}
 */
export async function guardAttestation(attestation, policy) {
  checkFreshness(attestation, {
    maxAgeMs: policy.maxAgeMs,
    clockSkewMs: policy.clockSkewMs,
    now: policy.now,
  });

  if (policy.schema) {
    checkSchema(attestation, policy.schema);
  }

  let nullifier = null;
  if (policy.nullifierStore) {
    nullifier = await attestationNullifier(attestation);
    if (policy.nullifierStore.has(nullifier)) {
      throw new AttestationGuardError("REPLAY", "Attestation has already been consumed", {
        nullifier,
      });
    }
    policy.nullifierStore.add(nullifier);
  }

  return { ok: true, nullifier };
}
