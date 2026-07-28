//! Single-file Pico zkVM guest: **Binance total wallet balance from a zkTLS attestation.**
//!
//! # REFERENCE ONLY -- does not build in this repo
//!
//! Production lives in brevis-zkcredit at
//! `vm/app/src/providers/binance/wallet_balance_v1/mod.rs` (route
//! `binance.wallet_balance.v1`), where input parsing, request binding and public-values encoding
//! come from `stable::` rather than being reimplemented.
//!
//! Kept purely to show the shape of a self-contained guest. Its test module covers only the
//! fixture-free logic; verifying a real attestation needs a production-signed capture, which this
//! repo deliberately does not ship.
//!
//! Self-contained reference implementation of the Brevis ZK Credit "Kaito" flow. Proves:
//!
//!   > The holder of `kaito_id` controls a Binance account whose wallet portfolio was worth
//!   > `totalValuationUsdtCents` across `assetCount` assets at `timestamp`.
//!
//! …without revealing which Binance account, and without any wallet address or on-chain contract.
//!
//! ## Design: "attest raw, parse in-circuit"
//!
//! The Primus attestation reveals the **whole HTTP response** using the ROOT selector
//! (`"field": "$"`). The attestor never parses or interprets the body — it only signs a commitment
//! to it. All parsing and business logic happens here, in the circuit, where it is provable.
//!
//! Because the reveal is a salted hash rather than a ciphertext, there is no in-circuit AES.
//! Measured cost: ~2.9M cycles (vs ~5.4M for complete-response/`nonecomplete` mode).
//!
//! ## Trust chain
//!
//! ```text
//!   pinned config keccak  →  config bytes are exactly the audited ones
//!   verify_signature      →  public_data signed by the pinned Binance attestor
//!   verify_url            →  response came from the pinned Binance endpoint
//!   verify_att_conditions →  reveal ops are exactly the audited ones
//!   verify_hash           →  sha256(content ‖ salt) == the hash inside SIGNED public_data.data
//!   ── everything below this line operates on attested bytes ──
//!   parse + sum           →  provable arithmetic over the raw response
//! ```
//!
//! ## Cargo.toml
//!
//! ```toml
//! [dependencies]
//! pico-sdk = { git = "https://github.com/brevis-network/pico" }
//! zktls-att-verification = { git = "https://github.com/primus-labs/zktls-att-verification.git", rev = "cd159ab3cb9ebbe91cc27048b2ae78675d72c38b" }
//! serde      = { version = "1", features = ["derive"] }
//! serde_json = "1"
//! anyhow     = "1"
//! hex        = "0.4"
//! ```

// `no_main` only outside `cargo test`, otherwise the test harness has no entry point.
#![cfg_attr(not(test), no_main)]

#[cfg(not(test))]
pico_sdk::entrypoint!(main);

use anyhow::{anyhow, bail, Result};
use pico_sdk::io::{commit_bytes, read_vec};
use serde::Deserialize;
use serde_json::Value;
use zktls_att_verification::{
    attestation_data::verify_attestation_data, ecdsa_utils::keccak256, tls_data::JsonData,
};

// ---------------------------------------------------------------------------------------------
// 1. Pinned data source
// ---------------------------------------------------------------------------------------------
//
// This config IS the security boundary. It pins the attestor key, the endpoint, and the exact
// reveal operation. `conditions` must match the attestation's signed `attConditions` byte for
// byte — the live Primus template emits `"reveal_id": "data"` on the reveal, so it appears here.
//
// The keccak fingerprint below is checked before the config is used, so a tampered config in a
// rebuilt guest changes the VK and is rejected by the verifier.

const ATTESTATION_CONFIG: &str = r#"{
  "attestor_addr": "0xdb736b13e2f522dbe18b2015d0291e4b193d8ef6",
  "url": [
    "https://www.binance.com/bapi/asset/v2/private/asset-service/wallet/asset?needAlphaAsset=true&needEuFuture=true"
  ],
  "conditions": [
    {
      "op": "REVEAL_SALTTED_HASH",
      "field": "{\"type\":\"FIELD_ARITHMETIC\",\"op\":\"SHA256_WITH_SALT\",\"field\":\"$\"}",
      "reveal_id": "data"
    }
  ]
}"#;

const ATTESTATION_CONFIG_KECCAK256: [u8; 32] = [
    0x48, 0x7f, 0x37, 0x15, 0x03, 0x18, 0x59, 0x87, 0xcc, 0xe2, 0xef, 0xc6, 0xc0, 0xdc, 0xfb, 0x4e,
    0xc5, 0x83, 0xa6, 0x6b, 0xd8, 0x16, 0xc1, 0x74, 0x28, 0x3d, 0x62, 0x3a, 0x40, 0x20, 0xd8, 0x1a,
];

/// The reveal slot carrying the whole raw response.
const RAW_RESPONSE_REVEAL_ID: &str = "data";

// ---------------------------------------------------------------------------------------------
// 2. Guest input
// ---------------------------------------------------------------------------------------------

#[derive(Deserialize)]
struct ProveRequest {
    /// 0x-prefixed 32-byte hex. Identifies the data provider (Binance).
    provider_id: String,
    /// 0x-prefixed 32-byte hex. Identifies the claim being proven (wallet balance v1).
    identity_property_id: String,
    resolved_unit_version: u64,
    /// Canonical JSON: `{"kaito_id":"<string>"}`.
    business_params_json: Vec<u8>,
    business_params_hash: [u8; 32],
    proof_request_canonical_hash: [u8; 32],
    /// Base64 of `attestation_payload`; hashed into the request binding.
    attestation_payload_b64: String,
    /// The Primus attestation JSON.
    attestation_payload: Vec<u8>,
}

/// What survives verification and is safe to use.
struct Attested {
    /// The attested Web2 identity source — becomes the nullifier. Never revealed.
    recipient: String,
    /// Attestation time in milliseconds. The circuit's only notion of "now".
    timestamp: u64,
    /// The whole raw HTTP response body, hash-bound to the signature.
    raw_response: String,
}

/// Result committed as `dataBlob`: `(uint256 totalValuationUsdtCents, uint256 assetCount)`.
struct WalletBalance {
    total_usdt_cents: u64,
    asset_count: u64,
}

// ---------------------------------------------------------------------------------------------
// 3. Entry point
// ---------------------------------------------------------------------------------------------

fn app_main() -> Result<()> {
    let req: ProveRequest = serde_json::from_slice(&read_vec())?;

    // (a) Bind the guest to exactly the request the user signed up for.
    let kaito_id = parse_business_params(&req.business_params_json)?;
    verify_request_binding(&req, &canonical_business_params_json(&kaito_id))?;

    // (b) Hard gate. Nothing below runs unless the attestation fully verifies.
    let attested = verify_attestation(&req.attestation_payload)?;

    // (c) Business logic over attested bytes.
    let balance = total_wallet_balance(&attested.raw_response)?;

    // (d) Commit.
    let public_values = encode_public_values(
        kaito_id.as_bytes(),
        &parse_hex_32(&req.provider_id)?,
        attested.recipient.as_bytes(),
        &parse_hex_32(&req.identity_property_id)?,
        attested.timestamp,
        &abi_encode_two_words(balance.total_usdt_cents, balance.asset_count),
    );
    commit_bytes(&public_values);

    Ok(())
}

pub fn main() {
    if let Err(e) = app_main() {
        // Fail closed: no proof is produced for a failed claim.
        panic!("guest error: {:?}", e);
    }
}

// ---------------------------------------------------------------------------------------------
// 4. Attestation verification
// ---------------------------------------------------------------------------------------------

/// Verify the attestation and return ONLY hash-checked data.
///
/// # Security: consume `messages`, never `private_data`
///
/// `verify_attestation_data` returns `(attestation, config, messages)`. It is tempting to verify
/// and then read `attestation.private_data[..].content` — **that is unsound.** In the pinned
/// crate, `PublicData::verify` dispatches per entry:
///
/// ```ignore
/// let json_data = if let Some(aes_key) = &private_data.aes_key {
///     self.verify_aes_ciphertext(aes_key)?   // <-- salted-hash check SKIPPED
/// } else if let Some(content) = &private_data.content {
///     self.verify_hash(id, content, private_data)?
/// }
/// ```
///
/// `private_data` is **not covered by the signature**. An attacker can therefore take a genuine
/// attestation, swap `content` for a fabricated response, and append any `aes_key`. The `aes_key`
/// branch wins; for a salted-hash attestation `public_data.data` holds no ciphertext key, so
/// `verify_aes_ciphertext` returns `Ok(vec![])` — an empty vector, *not* an error. Verification
/// "succeeds" having checked nothing about the body.
///
/// Two defences, both required:
///   1. Read the body out of `messages` (only hash-checked content lands there).
///   2. Reject an empty `messages`, since that is exactly what the bypass produces.
fn verify_attestation(payload: &[u8]) -> Result<Attested> {
    // Fingerprint the config before trusting it.
    if keccak256(ATTESTATION_CONFIG.as_bytes()) != ATTESTATION_CONFIG_KECCAK256 {
        bail!("pinned attestation config fingerprint mismatch");
    }

    let payload = core::str::from_utf8(payload)?;
    let (attestation, config, messages) = verify_attestation_data(payload, ATTESTATION_CONFIG)?;

    // Defence 2: the bypass shape yields zero verified messages.
    if messages.is_empty() {
        bail!("attestation produced no hash-verified content");
    }

    // Belt and braces: this route is salted-hash only, so `aes_key` must never appear.
    if attestation.private_data.iter().any(|p| p.aes_key.is_some()) {
        bail!("unexpected aes_key on a salted-hash attestation");
    }

    // The crate checks `attestor_addr` via signature recovery; also require the pinned attestor to
    // be declared, and reject an empty attestor set.
    if attestation.public_data.attestors.is_empty() {
        bail!("no attestors declared");
    }
    let expected = config.attestor_addr.trim_start_matches("0x");
    if !attestation
        .public_data
        .attestors
        .iter()
        .any(|a| a.attestorAddr.trim_start_matches("0x").eq_ignore_ascii_case(expected))
    {
        bail!("pinned attestor not among declared attestors");
    }

    // Defence 1: pull the body from the verified message set.
    let raw_response = verified_reveal(&messages, RAW_RESPONSE_REVEAL_ID)?;

    Ok(Attested {
        recipient: attestation.public_data.recipient,
        timestamp: attestation.public_data.timestamp,
        raw_response,
    })
}

/// Find the hash-verified reveal with `id`, and return its content.
///
/// On the salted-hash path each `JsonData.msg` is the serialized `PrivateData`:
/// `{"aes_key":null,"id":"data","content":["<raw body>"],"salt":"…"}`.
fn verified_reveal(messages: &[JsonData], id: &str) -> Result<String> {
    for m in messages {
        if m.msg.get("id").and_then(Value::as_str) != Some(id) {
            continue;
        }
        let content = m
            .msg
            .get("content")
            .and_then(Value::as_array)
            .ok_or_else(|| anyhow!("reveal `{id}` has no content array"))?;
        // The root selector yields exactly one fragment: the whole body.
        if content.len() != 1 {
            bail!("reveal `{id}` expected 1 fragment, got {}", content.len());
        }
        return Ok(content[0]
            .as_str()
            .ok_or_else(|| anyhow!("reveal `{id}` content is not a string"))?
            .to_string());
    }
    bail!("no verified reveal with id `{id}`")
}

// ---------------------------------------------------------------------------------------------
// 5. Business logic — the part that is actually about Binance
// ---------------------------------------------------------------------------------------------

/// Sum `valuationAmount` across every asset in the raw wallet-asset response.
///
/// Response shape:
/// ```json
/// { "code": "000000", "success": true,
///   "data": [ { "asset": "TKN", "amount": "0.10000000", "valuationAmount": "250.98765432" }, … ] }
/// ```
///
/// `valuationAmount` is a decimal STRING, denominated in USDT. Summed as integer cents so the
/// circuit stays integer-only and bit-exact across prover and verifier.
///
/// NOTE: truncation is per-asset, so the total is a lower bound — on a 10-asset portfolio the
/// error is a few cents, and it grows with the number of dust rows. Also note `asset_count`
/// counts rows, including dust that contributes 0 cents.
fn total_wallet_balance(raw: &str) -> Result<WalletBalance> {
    let body: Value = serde_json::from_str(raw)?;
    let assets = body
        .get("data")
        .and_then(Value::as_array)
        .ok_or_else(|| anyhow!("response has no `data` array"))?;

    let mut total_cents: u64 = 0;
    for asset in assets {
        let valuation = asset
            .get("valuationAmount")
            .and_then(Value::as_str)
            .ok_or_else(|| anyhow!("asset entry has no string `valuationAmount`"))?;
        total_cents = total_cents
            .checked_add(parse_amount_to_cents(valuation)?)
            .ok_or_else(|| anyhow!("balance overflow"))?;
    }

    Ok(WalletBalance {
        total_usdt_cents: total_cents,
        asset_count: assets.len() as u64,
    })
}

/// Parse a decimal amount (`"250.98765432"`, `"4.38"`, `"1300"`) into integer cents.
/// Extra fractional precision is truncated. Fails closed on anything non-numeric.
fn parse_amount_to_cents(input: &str) -> Result<u64> {
    let bytes = input.as_bytes();
    let mut i = 0usize;
    let mut seen_digit = false;
    let mut whole: u64 = 0;

    while i < bytes.len() && bytes[i].is_ascii_digit() {
        whole = whole
            .checked_mul(10)
            .and_then(|v| v.checked_add((bytes[i] - b'0') as u64))
            .ok_or_else(|| anyhow!("amount overflow in `{input}`"))?;
        i += 1;
        seen_digit = true;
    }

    let mut cents = whole
        .checked_mul(100)
        .ok_or_else(|| anyhow!("amount overflow in `{input}`"))?;

    if i < bytes.len() && bytes[i] == b'.' {
        i += 1;
        let mut take = || -> u64 {
            if i < bytes.len() && bytes[i].is_ascii_digit() {
                let v = (bytes[i] - b'0') as u64;
                i += 1;
                seen_digit = true;
                v
            } else {
                0
            }
        };
        let tenths = take();
        let hundredths = take();
        cents = cents
            .checked_add(tenths * 10 + hundredths)
            .ok_or_else(|| anyhow!("amount overflow in `{input}`"))?;
        while i < bytes.len() && bytes[i].is_ascii_digit() {
            i += 1; // truncate remaining precision
        }
    }

    if !seen_digit || i != bytes.len() {
        bail!("malformed amount `{input}`");
    }
    Ok(cents)
}

// ---------------------------------------------------------------------------------------------
// 6. Request binding — the guest proves it ran the request the user asked for
// ---------------------------------------------------------------------------------------------

/// Route business-params schema: `{"kaito_id": "<string>"}`. No wallet address anywhere.
fn parse_business_params(obj: &[u8]) -> Result<String> {
    let v: Value = serde_json::from_slice(obj)?;
    let map = v.as_object().ok_or_else(|| anyhow!("business_params not an object"))?;
    if map.len() != 1 {
        bail!("business_params must contain exactly `kaito_id`");
    }
    let kaito_id = map
        .get("kaito_id")
        .and_then(Value::as_str)
        .ok_or_else(|| anyhow!("business_params missing string `kaito_id`"))?;
    if kaito_id.is_empty() {
        bail!("kaito_id must not be empty");
    }
    Ok(kaito_id.to_string())
}

fn canonical_business_params_json(kaito_id: &str) -> String {
    format!("{{\"kaito_id\":\"{kaito_id}\"}}")
}

/// Re-derive both binding hashes in-circuit. This is what stops a host from swapping the
/// attestation or the business params after the request was created.
fn verify_request_binding(req: &ProveRequest, canonical_params: &str) -> Result<()> {
    if keccak256(canonical_params.as_bytes()) != req.business_params_hash {
        bail!("business_params hash binding mismatch");
    }

    let mut preimage = Vec::new();
    preimage.extend_from_slice(b"provider_id=");
    preimage.extend_from_slice(req.provider_id.as_bytes());
    preimage.extend_from_slice(b"\nidentity_property_id=");
    preimage.extend_from_slice(req.identity_property_id.as_bytes());
    preimage.extend_from_slice(b"\nresolved_unit_version=");
    preimage.extend_from_slice(req.resolved_unit_version.to_string().as_bytes());
    preimage.extend_from_slice(b"\nbusiness_params_hash=0x");
    preimage.extend_from_slice(hex::encode(req.business_params_hash).as_bytes());
    preimage.extend_from_slice(b"\nattestation_payload_hash=0x");
    preimage.extend_from_slice(
        hex::encode(keccak256(req.attestation_payload_b64.as_bytes())).as_bytes(),
    );

    if keccak256(&preimage) != req.proof_request_canonical_hash {
        bail!("proof-request hash binding mismatch");
    }
    Ok(())
}

// ---------------------------------------------------------------------------------------------
// 7. Public values — what the verifier reads
// ---------------------------------------------------------------------------------------------

/// ABI-encode the committed tuple:
///
/// ```solidity
/// (string kaitoId, bytes32 providerId, bytes32 web2IdNullifier,
///  bytes32 identityProperty, uint256 timestamp, bytes dataBlob)
/// ```
///
/// `web2IdNullifier = keccak256(providerId ‖ canonical(web2Id))`. The Binance identity itself is
/// never revealed, but the nullifier is stable — so two `kaito_id`s backed by the same Binance
/// account are linkable, which is what makes Sybil resistance possible.
fn encode_public_values(
    kaito_id: &[u8],
    provider_id: &[u8; 32],
    web2_id: &[u8],
    identity_property_id: &[u8; 32],
    timestamp: u64,
    data_blob: &[u8],
) -> Vec<u8> {
    const WORD: usize = 32;
    const HEAD_WORDS: usize = 6;

    let mut nullifier_input = Vec::with_capacity(WORD + web2_id.len());
    nullifier_input.extend_from_slice(provider_id);
    nullifier_input.extend_from_slice(canonicalize_web2_id(web2_id).as_slice());
    let nullifier = keccak256(&nullifier_input);

    let head = HEAD_WORDS * WORD;
    let kaito_tail = WORD + kaito_id.len().div_ceil(WORD) * WORD;
    let blob_tail = WORD + data_blob.len().div_ceil(WORD) * WORD;
    let mut out = vec![0u8; WORD + head + kaito_tail + blob_tail];

    // Top-level dynamic-tuple envelope.
    write_word(&mut out, 0, WORD as u64);

    let t = WORD;
    write_word(&mut out, t, head as u64); // head[0] kaitoId offset
    out[t + WORD..t + 2 * WORD].copy_from_slice(provider_id); // head[1]
    out[t + 2 * WORD..t + 3 * WORD].copy_from_slice(&nullifier); // head[2]
    out[t + 3 * WORD..t + 4 * WORD].copy_from_slice(identity_property_id); // head[3]
    write_word(&mut out, t + 4 * WORD, timestamp); // head[4]
    write_word(&mut out, t + 5 * WORD, (head + kaito_tail) as u64); // head[5] dataBlob offset

    let k = t + head;
    write_word(&mut out, k, kaito_id.len() as u64);
    out[k + WORD..k + WORD + kaito_id.len()].copy_from_slice(kaito_id);

    let b = t + head + kaito_tail;
    write_word(&mut out, b, data_blob.len() as u64);
    out[b + WORD..b + WORD + data_blob.len()].copy_from_slice(data_blob);

    out
}

/// `dataBlob` for this route: two plain 32-byte words. Note there is **no** dynamic-tuple offset
/// prefix here — decoders that assume one will read garbage.
fn abi_encode_two_words(a: u64, b: u64) -> Vec<u8> {
    let mut out = vec![0u8; 64];
    write_word(&mut out, 0, a);
    write_word(&mut out, 32, b);
    out
}

fn write_word(out: &mut [u8], at: usize, value: u64) {
    out[at + 24..at + 32].copy_from_slice(&value.to_be_bytes());
}

/// Trim and lowercase, so the nullifier is stable across cosmetic differences.
fn canonicalize_web2_id(input: &[u8]) -> Vec<u8> {
    input.trim_ascii().to_ascii_lowercase()
}

fn parse_hex_32(s: &str) -> Result<[u8; 32]> {
    let bytes = hex::decode(s.trim_start_matches("0x"))?;
    let arr: [u8; 32] = bytes
        .as_slice()
        .try_into()
        .map_err(|_| anyhow!("expected 32-byte hex, got {} bytes", bytes.len()))?;
    Ok(arr)
}

// ---------------------------------------------------------------------------------------------
// 8. Tests
// ---------------------------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // Only fixture-free tests live here. Verifying a real attestation needs a production-signed
    // capture, which this repo deliberately does not ship (the signature covers the account data,
    // so such a file cannot be de-identified). Those tests -- including the aes_key forgery
    // regressions -- live with the production route in brevis-zkcredit, where the fixture exists.

    #[test]
    fn config_fingerprint_matches() {
        assert_eq!(
            keccak256(ATTESTATION_CONFIG.as_bytes()),
            ATTESTATION_CONFIG_KECCAK256
        );
    }

    #[test]
    fn business_params_reject_wallet() {
        assert_eq!(
            parse_business_params(br#"{"kaito_id":"kaito-user-1"}"#).unwrap(),
            "kaito-user-1"
        );
        assert!(parse_business_params(br#"{}"#).is_err());
        assert!(parse_business_params(br#"{"wallet":"0xabc"}"#).is_err());
        assert!(parse_business_params(br#"{"kaito_id":"a","wallet":"0xabc"}"#).is_err());
    }

    #[test]
    fn amounts_truncate_not_round() {
        assert_eq!(parse_amount_to_cents("250.98765432").unwrap(), 25098);
        assert_eq!(parse_amount_to_cents("0.00698632").unwrap(), 0);
        assert_eq!(parse_amount_to_cents("1300").unwrap(), 130000);
        assert!(parse_amount_to_cents("1.2.3").is_err());
        assert!(parse_amount_to_cents("abc").is_err());
        assert!(parse_amount_to_cents("").is_err());
    }

    #[test]
    fn data_blob_is_two_plain_words() {
        let blob = abi_encode_two_words(25098, 10);
        assert_eq!(blob.len(), 64);
        assert_eq!(u64::from_be_bytes(blob[24..32].try_into().unwrap()), 25098);
        assert_eq!(u64::from_be_bytes(blob[56..64].try_into().unwrap()), 10);
    }
}
