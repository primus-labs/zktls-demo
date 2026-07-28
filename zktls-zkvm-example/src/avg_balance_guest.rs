//! Single-file Pico zkVM guest: **Binance 31-day time-weighted average balance.**
//!
//! Proves, from ONE four-request zkTLS attestation (Primus template
//! `62df67c2-2ef7-45ca-bf67-72bdce5dc54b`):
//!
//!   > The holder of `kaito_id` controls Binance account `userId`, whose time-weighted average
//!   > balance over the attested window was `avgBalanceUsdtCents`.
//!
//! ...without revealing the Binance account.
//!
//! # REFERENCE ONLY -- not the production guest
//!
//! Production lives in brevis-zkcredit at
//! `vm/app/src/providers/binance/avg_balance_v1/mod.rs`, wired as route
//! `binance.avg_balance.v1`. This file is a self-contained illustration: everything below the
//! business logic -- input parsing, request binding, public-values encoding -- is reimplemented
//! here purely so the file stands alone.
//!
//! Do not treat it as a second implementation to keep in sync. In particular its `ProveRequest`
//! is invented for this example and does NOT match the wire format the backend sends (which is
//! `canonicalJSON(picoSerializedTaskInput)` inside a bincode stdin frame, parsed by
//! `stable::parse_prove_request`). The production route reuses `stable::` for all three of those
//! concerns so they stay byte-identical across routes -- duplicating them is how they drift, and
//! the reveal-forgery bug existed precisely because one route re-implemented reveal extraction.
//!
//! ## The attestation
//!
//! Four requests, one signature. Each reveal is already narrowed by the template's `parsePath`,
//! so the guest receives exactly what it needs and nothing else:
//!
//! ```text
//!   [0] GET  accounts/v1/private/account/get-user-base-info
//!            reveal `userId`        $.data.userId    -> the account id string
//!   [1] GET  asset/v2/private/asset-service/wallet/asset?needAlphaAsset=true&needEuFuture=true
//!            reveal `tokenList`     $.data           -> [{asset, amount, valuationAmount, …}]
//!   [2] POST capital/v1/private/capital/deposit/list
//!            reveal `depositList`   $.data.rows      -> [{coin, transferAmount, insertTime, …}]
//!   [3] POST apex/v1/private/apex/web/portfolio/alpha/withdraw/history-list
//!            reveal `withdrawList`  $.data.rows      -> [{symbol, transferAmount,
//!                                                        transactionFee, applyTime, …}]
//! ```
//!
//! The window for [2] and [3] arrives in their POST **body**, not the URL. `RequestData::
//! encode_packed` covers url + header + method + body, so the body is inside the signature
//! preimage and safe to constrain against.
//!
//! ## How the average is computed
//!
//! These are *events*, not daily samples, so this is a TRUE time-weighted average rather than a
//! daily-sampled mean -- which also means it cannot be gamed by holding funds only across a
//! sampling instant.
//!
//!   1. anchor at the attested `tokenList` snapshot -- the only balance directly observed
//!   2. walk events backwards to recover each inter-event segment's balance
//!   3. weight each segment by its duration
//!   4. value the resulting average holdings at the snapshot's own implied price
//!
//! Step 2 is **exact**: `withdrawList` reports `transactionFee` separately, so the true debit is
//! `transferAmount + transactionFee`. On the test fixture the implied pre-window balance comes
//! out at precisely zero, with no fudge factor.
//!
//! ## LIMITATIONS (deliberate, for the demo)
//!
//! - **Omitting a deposit inflates the result and is undetectable here.** Anchoring at the
//!   snapshot and walking backwards means undoing a deposit *lowers* the earlier balance; so a
//!   missing deposit leaves earlier balances high. On the test fixture, dropping the single
//!   deposit takes 10000 cents to 16451 -- and the residual goes positive, so no check in this file
//!   fires. The mirror case, a missing withdrawal, drives the residual negative and *is* rejected
//!   -- but that direction lowers the reported figure, so it is not one a prover would choose.
//! - **Truncation of a feed cannot be detected in-circuit.** `parsePath` is `$.data.rows`, so the
//!   attested value is the rows array ALONE; the sibling `$.data.total` is outside the reveal and
//!   therefore unattested. A `rows.len() == total` check is impossible with this template. All that
//!   stands between the guest and a silently short feed is `page.limit` / `page.offset` being
//!   pinned from the signed body, plus the assumption that the account had no more than `limit`
//!   movements in the window. Beyond 200, the feed truncates and this guest cannot tell.
//!   Detecting it would need `total` inside the reveal -- i.e. `parsePath: $.data`.
//! - **Single price point.** Average *holdings* are valued at the snapshot price, not at each
//!   moment's historical price. Report the output as "average holdings valued at attestation-time
//!   prices", not "average USD balance".
//! - **Only deposits and withdrawals move the balance here.** Trades are ~value-neutral, but
//!   staking rewards, interest and airdrops are not in these feeds.
//! - **A coin fully withdrawn during the window has no snapshot price** and cannot be valued; this
//!   fails closed rather than silently dropping it.
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
// `url[0]` matches `request.url`; `url[i>0]` matches `additionParams["requests[i].url"]`. Matching
// is PREFIX-based unless prefixed `<REGEX>`.
//
// `conditions` must equal the signed `attConditions` exactly -- verify_att_conditions compares the
// serialized condition objects positionally. The ops below are SHA256_WITH_SALT because the demo
// requests that via setAttConditions; a template whose data-item names do not match the `field`
// values silently falls back to REVEAL_STRING, which would fail this comparison (loudly, here).

const ATTESTATION_CONFIG: &str = r#"{
  "attestor_addr": "0xdb736b13e2f522dbe18b2015d0291e4b193d8ef6",
  "url": [
    "https://www.binance.com/bapi/accounts/v1/private/account/get-user-base-info",
    "https://www.binance.com/bapi/asset/v2/private/asset-service/wallet/asset",
    "https://www.binance.com/bapi/capital/v1/private/capital/deposit/list",
    "https://www.binance.com/bapi/apex/v1/private/apex/web/portfolio/alpha/withdraw/history-list"
  ],
  "conditions": [
    {
      "op": "REVEAL_SALTTED_HASH",
      "field": "{\"type\":\"FIELD_ARITHMETIC\",\"op\":\"SHA256_WITH_SALT\",\"field\":\"$.data.userId\"}",
      "reveal_id": "userId"
    },
    {
      "op": "REVEAL_SALTTED_HASH",
      "field": "{\"type\":\"FIELD_ARITHMETIC\",\"op\":\"SHA256_WITH_SALT\",\"field\":\"$.data\"}",
      "reveal_id": "tokenList"
    },
    {
      "op": "REVEAL_SALTTED_HASH",
      "field": "{\"type\":\"FIELD_ARITHMETIC\",\"op\":\"SHA256_WITH_SALT\",\"field\":\"$.data.rows\"}",
      "reveal_id": "depositList"
    },
    {
      "op": "REVEAL_SALTTED_HASH",
      "field": "{\"type\":\"FIELD_ARITHMETIC\",\"op\":\"SHA256_WITH_SALT\",\"field\":\"$.data.rows\"}",
      "reveal_id": "withdrawList"
    }
  ]
}"#;

const REVEAL_USER_ID: &str = "userId";
const REVEAL_TOKENS: &str = "tokenList";
const REVEAL_DEPOSITS: &str = "depositList";
const REVEAL_WITHDRAWALS: &str = "withdrawList";

/// Substrings identifying the two paginated requests, used to locate their signed POST bodies.
const DEPOSIT_ENDPOINT: &str = "/capital/deposit/list";
const WITHDRAW_ENDPOINT: &str = "/withdraw/history-list";

/// Expected window span. The caller builds [UTC midnight 30 days ago, UTC end of today], which is
/// 31 calendar days.
const EXPECTED_WINDOW_MS: i128 = 31 * 24 * 60 * 60 * 1000;
/// The window ends at end-of-day UTC, so it sits after the attestation instant by up to a day.
/// Bounding this stops the window being shifted away from the attestation.
const MAX_END_AFTER_ATTESTATION_MS: i128 = 24 * 60 * 60 * 1000;
/// Pinned pagination. `limit` is the documented maximum; `offset` must be the first page.
const EXPECTED_LIMIT: u64 = 200;
const EXPECTED_OFFSET: u64 = 0;

/// Only settled movements affect the balance. Pending or failed rows are skipped -- they have not
/// moved funds -- but they are counted so the number of skipped rows is visible in the output.
const STATUS_COMPLETED: &str = "Completed";

/// Fixed-point scale for coin amounts and USDT valuations (8 decimals).
const SCALE: i128 = 100_000_000;

// ---------------------------------------------------------------------------------------------
// 2. Guest input
// ---------------------------------------------------------------------------------------------

#[derive(Deserialize)]
struct ProveRequest {
    provider_id: String,
    identity_property_id: String,
    resolved_unit_version: u64,
    business_params_json: Vec<u8>,
    business_params_hash: [u8; 32],
    proof_request_canonical_hash: [u8; 32],
    attestation_payload_b64: String,
    attestation_payload: Vec<u8>,
}

struct Attested {
    timestamp: i128,
    user_id: String,
    token_list: String,
    deposit_list: String,
    withdraw_list: String,
    /// Signed POST bodies of the two paginated requests; both must describe the same window.
    deposit_body: String,
    withdraw_body: String,
}

struct Window {
    start: i128,
    end: i128,
}

/// One settled movement. `delta` is signed and SCALE-scaled: deposits positive, withdrawals
/// negative and inclusive of `transactionFee`.
struct Event {
    time: i128,
    coin: String,
    delta: i128,
}

/// A coin's attested snapshot. The implied price is `valuation / amount`, kept as a ratio so no
/// division happens before it must.
struct Holding {
    coin: String,
    amount: i128,
    valuation: i128,
}

// ---------------------------------------------------------------------------------------------
// 3. Entry point
// ---------------------------------------------------------------------------------------------

fn app_main() -> Result<()> {
    let req: ProveRequest = serde_json::from_slice(&read_vec())?;

    let kaito_id = parse_business_params(&req.business_params_json)?;
    verify_request_binding(&req, &canonical_business_params_json(&kaito_id))?;

    let att = verify_attestation(&req.attestation_payload)?;

    // Both feeds are parameterised by the caller, so re-derive the window from the SIGNED bodies
    // and require the two to agree.
    let window = verify_window(&att.deposit_body, &att.withdraw_body, att.timestamp)?;

    let user_id = parse_user_id(&att.user_id)?;
    let holdings = parse_holdings(&att.token_list)?;
    let mut events = parse_deposits(&att.deposit_list, &window, &user_id)?;
    events.extend(parse_withdrawals(&att.withdraw_list, &window, &user_id)?);
    events.sort_by_key(|e| e.time);

    let avg_cents = time_weighted_average_cents(&holdings, &events, &window)?;

    let data_blob = abi_encode_three_words(
        u64::try_from(avg_cents).map_err(|_| anyhow!("negative average: {avg_cents}"))?,
        (window.end - window.start) as u64,
        events.len() as u64,
    );

    let public_values = encode_public_values(
        kaito_id.as_bytes(),
        &parse_hex_32(&req.provider_id)?,
        // Nullifier source is the ATTESTED Binance userId, not `recipient` -- `recipient` is
        // chosen by whoever requested the attestation, so keying on it would let one Binance
        // account mint unlimited distinct nullifiers.
        user_id.as_bytes(),
        &parse_hex_32(&req.identity_property_id)?,
        att.timestamp as u64,
        &data_blob,
    );
    commit_bytes(&public_values);
    Ok(())
}

pub fn main() {
    if let Err(e) = app_main() {
        panic!("guest error: {:?}", e);
    }
}

// ---------------------------------------------------------------------------------------------
// 4. Attestation verification
// ---------------------------------------------------------------------------------------------

/// Verify, then return ONLY hash-checked reveal content.
///
/// Content must come from the verified `messages`, never from a re-read of the raw payload.
/// `private_data` is not in the signature preimage, and the salted-hash check that would bind it
/// is bypassable: appending an `aes_key` to a reveal routes it through `verify_aes_ciphertext`,
/// which skips the hash check and -- with no ciphertext key in `public_data.data` -- returns
/// `Ok(vec![])` while overall verification still succeeds. The forged reveal is simply absent from
/// `messages`. Hence: read from `messages`, reject an empty set, reject any `aes_key`.
fn verify_attestation(payload: &[u8]) -> Result<Attested> {
    let payload = core::str::from_utf8(payload)?;
    let (attestation, config, messages) = verify_attestation_data(payload, ATTESTATION_CONFIG)?;

    if messages.is_empty() {
        bail!("attestation produced no hash-verified content");
    }
    if attestation.private_data.iter().any(|p| p.aes_key.is_some()) {
        bail!("unexpected aes_key on a salted-hash attestation");
    }
    if attestation.public_data.attestors.is_empty() {
        bail!("no attestors declared");
    }
    let expected = config.attestor_addr.trim_start_matches("0x");
    if !attestation.public_data.attestors.iter().any(|a| {
        a.attestorAddr
            .trim_start_matches("0x")
            .eq_ignore_ascii_case(expected)
    }) {
        bail!("pinned attestor not among declared attestors");
    }

    let extra: Value = serde_json::from_str(&attestation.public_data.additionParams)?;
    Ok(Attested {
        timestamp: attestation.public_data.timestamp as i128,
        user_id: verified_reveal(&messages, REVEAL_USER_ID)?,
        token_list: verified_reveal(&messages, REVEAL_TOKENS)?,
        deposit_list: verified_reveal(&messages, REVEAL_DEPOSITS)?,
        withdraw_list: verified_reveal(&messages, REVEAL_WITHDRAWALS)?,
        deposit_body: signed_request_body(&extra, DEPOSIT_ENDPOINT)?,
        withdraw_body: signed_request_body(&extra, WITHDRAW_ENDPOINT)?,
    })
}

/// Pull the hash-verified reveal with `id`. On the salted-hash path each `JsonData.msg` is the
/// serialized `PrivateData`: `{"aes_key":null,"id":…,"content":[…],"salt":…}`.
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

/// Find the signed POST body of the request whose url contains `endpoint`.
///
/// `additionParams` holds `requests[N].url` / `requests[N].body` for every request after the
/// first, and is itself inside the signature preimage.
fn signed_request_body(extra: &Value, endpoint: &str) -> Result<String> {
    let obj = extra
        .as_object()
        .ok_or_else(|| anyhow!("additionParams is not an object"))?;
    for (k, v) in obj {
        let Some(idx) = k
            .strip_prefix("requests[")
            .and_then(|r| r.strip_suffix("].url"))
        else {
            continue;
        };
        if !v.as_str().is_some_and(|u| u.contains(endpoint)) {
            continue;
        }
        return obj
            .get(&format!("requests[{idx}].body"))
            .and_then(Value::as_str)
            .map(str::to_owned)
            .ok_or_else(|| anyhow!("requests[{idx}] has no signed body"));
    }
    bail!("no signed request found for endpoint {endpoint}")
}

// ---------------------------------------------------------------------------------------------
// 5. Window verification
// ---------------------------------------------------------------------------------------------

/// Constrain the caller-chosen window and pagination, from the signed bodies of BOTH feeds.
///
/// Pinning the urls in the config is not sufficient -- matching is prefix based, and here the
/// parameters live in the POST body anyway. Requiring both feeds to describe the identical window
/// also stops a deposit feed being paired with a differently-windowed withdrawal feed.
fn verify_window(deposit_body: &str, withdraw_body: &str, attested_ts: i128) -> Result<Window> {
    let d = parse_window_body(deposit_body).map_err(|e| anyhow!("deposit body: {e}"))?;
    let w = parse_window_body(withdraw_body).map_err(|e| anyhow!("withdraw body: {e}"))?;
    if d.start != w.start || d.end != w.end {
        bail!(
            "deposit and withdraw windows differ: [{}..{}] vs [{}..{}]",
            d.start,
            d.end,
            w.start,
            w.end
        );
    }

    // endTime is inclusive-to-the-millisecond (…199999), so the span is end-start+1.
    let span = d.end - d.start + 1;
    if span != EXPECTED_WINDOW_MS {
        bail!("window span must be {EXPECTED_WINDOW_MS}ms, got {span}ms");
    }
    if d.end < attested_ts {
        bail!("window ends before the attestation ({} < {attested_ts})", d.end);
    }
    if d.end - attested_ts > MAX_END_AFTER_ATTESTATION_MS {
        bail!(
            "window ends {}ms after the attestation, over the {MAX_END_AFTER_ATTESTATION_MS}ms bound",
            d.end - attested_ts
        );
    }
    Ok(d)
}

fn parse_window_body(body: &str) -> Result<Window> {
    let v: Value = serde_json::from_str(body)?;
    let start = v
        .get("startTime")
        .and_then(Value::as_i64)
        .ok_or_else(|| anyhow!("no startTime"))? as i128;
    let end = v
        .get("endTime")
        .and_then(Value::as_i64)
        .ok_or_else(|| anyhow!("no endTime"))? as i128;
    let page = v.get("page").ok_or_else(|| anyhow!("no page"))?;
    let limit = page
        .get("limit")
        .and_then(Value::as_u64)
        .ok_or_else(|| anyhow!("no page.limit"))?;
    let offset = page
        .get("offset")
        .and_then(Value::as_u64)
        .ok_or_else(|| anyhow!("no page.offset"))?;
    if limit != EXPECTED_LIMIT {
        bail!("page.limit must be {EXPECTED_LIMIT}, got {limit}");
    }
    if offset != EXPECTED_OFFSET {
        bail!("page.offset must be {EXPECTED_OFFSET}, got {offset}");
    }
    Ok(Window { start, end })
}

// ---------------------------------------------------------------------------------------------
// 6. Parsing the attested reveals
// ---------------------------------------------------------------------------------------------

/// `userId` is revealed as a bare scalar (`$.data.userId`), so it arrives as a plain string.
fn parse_user_id(reveal: &str) -> Result<String> {
    let id = reveal.trim().trim_matches('"');
    if id.is_empty() || !id.bytes().all(|b| b.is_ascii_digit()) {
        bail!("userId must be a non-empty decimal string, got {reveal:?}");
    }
    Ok(id.to_string())
}

/// `tokenList` is revealed as `$.data` -- a bare array of holdings.
fn parse_holdings(reveal: &str) -> Result<Vec<Holding>> {
    let rows: Vec<Value> = serde_json::from_str(reveal)?;
    let mut out = Vec::with_capacity(rows.len());
    for r in &rows {
        let coin = str_field(r, "asset")?;
        out.push(Holding {
            amount: parse_decimal_scaled(&str_field(r, "amount")?)?,
            valuation: parse_decimal_scaled(&str_field(r, "valuationAmount")?)?,
            coin,
        });
    }
    Ok(out)
}

/// `depositList` is `$.data.rows`. Amount field is `transferAmount`, timestamp `insertTime`,
/// coin `coin`.
fn parse_deposits(reveal: &str, window: &Window, user_id: &str) -> Result<Vec<Event>> {
    let rows: Vec<Value> = serde_json::from_str(reveal)?;
    let mut out = Vec::new();
    for r in &rows {
        check_row_user(r, user_id)?;
        if !is_completed(r) {
            continue; // not settled, so it has not moved funds
        }
        let time = i64_field(r, "insertTime")? as i128;
        check_in_window(time, window)?;
        out.push(Event {
            time,
            coin: str_field(r, "coin")?,
            delta: parse_decimal_scaled(&str_field(r, "transferAmount")?)?,
        });
    }
    Ok(out)
}

/// `withdrawList` is `$.data.rows`. Note the field names differ from deposits: the coin is
/// `symbol` (not `coin`) and the timestamp is `applyTime` (not `insertTime`).
///
/// The balance debit is `transferAmount + transactionFee`: `transferAmount` is what the recipient
/// receives, and the fee is deducted on top. Using `transferAmount` alone leaves the
/// reconstruction short by exactly the fees.
fn parse_withdrawals(reveal: &str, window: &Window, user_id: &str) -> Result<Vec<Event>> {
    let rows: Vec<Value> = serde_json::from_str(reveal)?;
    let mut out = Vec::new();
    for r in &rows {
        check_row_user(r, user_id)?;
        if !is_completed(r) {
            continue;
        }
        let time = i64_field(r, "applyTime")? as i128;
        check_in_window(time, window)?;
        let sent = parse_decimal_scaled(&str_field(r, "transferAmount")?)?;
        let fee = parse_decimal_scaled(&str_field(r, "transactionFee")?)?;
        out.push(Event {
            time,
            coin: str_field(r, "symbol")?,
            delta: -(sent + fee),
        });
    }
    Ok(out)
}

fn is_completed(row: &Value) -> bool {
    row.get("statusName").and_then(Value::as_str) == Some(STATUS_COMPLETED)
}

/// Every row carries the owning `userId`. Cheap to check, and it catches a template wired to the
/// wrong account or feeds spliced together.
fn check_row_user(row: &Value, user_id: &str) -> Result<()> {
    let row_user = match row.get("userId") {
        Some(Value::String(s)) => s.clone(),
        Some(Value::Number(n)) => n.to_string(),
        _ => bail!("history row has no userId"),
    };
    if row_user != user_id {
        bail!("history row belongs to userId {row_user}, expected {user_id}");
    }
    Ok(())
}

fn check_in_window(time: i128, window: &Window) -> Result<()> {
    if time < window.start || time > window.end {
        bail!("history row at {time} falls outside the attested window");
    }
    Ok(())
}

fn str_field(v: &Value, key: &str) -> Result<String> {
    v.get(key)
        .and_then(Value::as_str)
        .map(str::to_owned)
        .ok_or_else(|| anyhow!("row has no string `{key}`"))
}

fn i64_field(v: &Value, key: &str) -> Result<i64> {
    v.get(key)
        .and_then(Value::as_i64)
        .ok_or_else(|| anyhow!("row has no integer `{key}`"))
}

/// Parse an unsigned decimal into a SCALE-scaled integer. Precision beyond 8 decimals is
/// truncated. Fails closed on anything non-numeric.
fn parse_decimal_scaled(s: &str) -> Result<i128> {
    let (int_part, frac_part) = s.split_once('.').unwrap_or((s, ""));
    if int_part.is_empty() && frac_part.is_empty() {
        bail!("empty decimal");
    }
    let mut v: i128 = 0;
    for b in int_part.bytes() {
        if !b.is_ascii_digit() {
            bail!("malformed decimal {s:?}");
        }
        v = v
            .checked_mul(10)
            .and_then(|x| x.checked_add((b - b'0') as i128))
            .ok_or_else(|| anyhow!("decimal overflow in {s:?}"))?;
    }
    v = v
        .checked_mul(SCALE)
        .ok_or_else(|| anyhow!("decimal overflow in {s:?}"))?;

    let mut unit = SCALE / 10;
    for b in frac_part.bytes() {
        if !b.is_ascii_digit() {
            bail!("malformed decimal {s:?}");
        }
        if unit > 0 {
            v += (b - b'0') as i128 * unit;
            unit /= 10;
        }
    }
    Ok(v)
}

// ---------------------------------------------------------------------------------------------
// 7. The computation
// ---------------------------------------------------------------------------------------------

/// Time-weighted average holdings over the window, valued at the snapshot's implied price.
///
/// Per coin:
///   avg_amount = Σ(balance_i × duration_i) / total_duration
///   cents      = avg_amount × valuation_now × 100 / (SCALE × amount_now)
///
/// Valuing through the `valuation_now / amount_now` ratio keeps the price exact -- no separate
/// division, no oracle.
///
/// # The residual check catches the direction that does not matter
///
/// Anchoring at the snapshot and walking backwards, undoing a deposit LOWERS the earlier balance
/// and undoing a withdrawal RAISES it. So a missing deposit leaves earlier balances high and
/// INFLATES the average, with a positive residual that nothing here detects; a missing withdrawal
/// collapses them and trips the negative bound below. Only the second is caught, and only the
/// first is profitable. See LIMITATIONS.
fn time_weighted_average_cents(
    holdings: &[Holding],
    events: &[Event],
    window: &Window,
) -> Result<i128> {
    let total_dur = window.end - window.start;
    if total_dur <= 0 {
        bail!("non-positive window duration");
    }

    // Any coin with movements must be priceable from the snapshot.
    for e in events {
        if !holdings.iter().any(|h| h.coin == e.coin) {
            bail!(
                "coin {} appears in history but not in the snapshot -- no price available",
                e.coin
            );
        }
    }

    let mut total_cents: i128 = 0;
    for h in holdings {
        let mut weighted: i128 = 0;
        let mut balance = h.amount;
        let mut seg_end = window.end;
        for e in events.iter().filter(|e| e.coin == h.coin).rev() {
            weighted += balance * (seg_end - e.time);
            balance -= e.delta; // undo the event to recover the earlier balance
            seg_end = e.time;
        }

        // With `transactionFee` accounted for, the reconstruction is exact, so a negative implied
        // pre-window balance means the feeds are genuinely inconsistent with the snapshot -- no
        // tolerance to hide in.
        if balance < 0 {
            bail!(
                "implied pre-window balance for {} is {} (scaled) -- the feeds are inconsistent \
                 with the snapshot",
                h.coin,
                balance
            );
        }
        weighted += balance * (seg_end - window.start);

        let avg_amount = weighted / total_dur;
        if h.amount == 0 {
            if avg_amount != 0 {
                bail!("coin {} has movements but zero snapshot amount", h.coin);
            }
            continue;
        }
        total_cents += avg_amount * h.valuation * 100 / (SCALE * h.amount);
    }
    Ok(total_cents)
}

// ---------------------------------------------------------------------------------------------
// 8. Request binding
// ---------------------------------------------------------------------------------------------

fn parse_business_params(obj: &[u8]) -> Result<String> {
    let v: Value = serde_json::from_slice(obj)?;
    let map = v
        .as_object()
        .ok_or_else(|| anyhow!("business_params not an object"))?;
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
// 9. Public values
// ---------------------------------------------------------------------------------------------

/// ```solidity
/// (string kaitoId, bytes32 providerId, bytes32 web2IdNullifier,
///  bytes32 identityProperty, uint256 timestamp, bytes dataBlob)
/// ```
/// `web2IdNullifier = keccak256(providerId ‖ canonical(userId))`.
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
    nullifier_input.extend_from_slice(&web2_id.trim_ascii().to_ascii_lowercase());
    let nullifier = keccak256(&nullifier_input);

    let head = HEAD_WORDS * WORD;
    let kaito_tail = WORD + kaito_id.len().div_ceil(WORD) * WORD;
    let blob_tail = WORD + data_blob.len().div_ceil(WORD) * WORD;
    let mut out = vec![0u8; WORD + head + kaito_tail + blob_tail];

    write_word(&mut out, 0, WORD as u64);
    let t = WORD;
    write_word(&mut out, t, head as u64);
    out[t + WORD..t + 2 * WORD].copy_from_slice(provider_id);
    out[t + 2 * WORD..t + 3 * WORD].copy_from_slice(&nullifier);
    out[t + 3 * WORD..t + 4 * WORD].copy_from_slice(identity_property_id);
    write_word(&mut out, t + 4 * WORD, timestamp);
    write_word(&mut out, t + 5 * WORD, (head + kaito_tail) as u64);

    let k = t + head;
    write_word(&mut out, k, kaito_id.len() as u64);
    out[k + WORD..k + WORD + kaito_id.len()].copy_from_slice(kaito_id);

    let b = t + head + kaito_tail;
    write_word(&mut out, b, data_blob.len() as u64);
    out[b + WORD..b + WORD + data_blob.len()].copy_from_slice(data_blob);
    out
}

/// `dataBlob`: `(uint256 avgBalanceUsdtCents, uint256 windowMillis, uint256 eventCount)` --
/// THREE PLAIN WORDS, no dynamic-tuple offset prefix. A decoder assuming a leading offset word
/// reads garbage.
fn abi_encode_three_words(a: u64, b: u64, c: u64) -> Vec<u8> {
    let mut out = vec![0u8; 96];
    write_word(&mut out, 0, a);
    write_word(&mut out, 32, b);
    write_word(&mut out, 64, c);
    out
}

fn write_word(out: &mut [u8], at: usize, value: u64) {
    out[at + 24..at + 32].copy_from_slice(&value.to_be_bytes());
}

fn parse_hex_32(s: &str) -> Result<[u8; 32]> {
    let bytes = hex::decode(s.trim_start_matches("0x"))?;
    bytes
        .as_slice()
        .try_into()
        .map_err(|_| anyhow!("expected 32-byte hex, got {} bytes", bytes.len()))
}

// ---------------------------------------------------------------------------------------------
// 10. Tests — against the REAL captured reveals
// ---------------------------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // SYNTHETIC fixtures -- structurally identical to a real four-request capture but carrying no
    // account data. Numbers chosen so the arithmetic checks by hand and the reconstruction still
    // lands on exactly zero:
    //   snapshot 1.0 TKN @ 100.00 USDT (price 100), deposit +2.0 at day 10,
    //   withdraw 0.9 + 0.1 fee = 1.0 debit at day 20  =>  average holdings 1.0 TKN => 10000 cents
    const USER_ID: &str = "9000000001";
    const TOKEN_LIST: &str = r#"[{"asset":"TKN","assetName":"TKN","amount":"1.0","logoUrl":"x","valuationAmount":"100.00","profit":null,"isCexAsset":true,"coinBusinessType":"CRYPTO"}]"#;
    const DEPOSIT_LIST: &str = r#"[{"id":"dep-1","transferAmount":"2.0","ledgerAmount":"2.0","insertTime":1000864000000,"status":1,"userId":9000000001,"coin":"TKN","statusName":"Completed","network":"TESTNET"}]"#;
    const WITHDRAW_LIST: &str = r#"[{"id":"wd-1","transferAmount":"0.9","transactionFee":"0.1","applyTime":1001728000000,"status":6,"userId":9000000001,"symbol":"TKN","statusName":"Completed","network":"TESTNET","ledgerAmount":"0.9"}]"#;
    const PAGE_BODY: &str =
        r#"{"startTime":1000000000000,"endTime":1002678399999,"page":{"limit":200,"offset":0}}"#;
    const ATTESTED_TS: i128 = 1002674799999;

    fn window() -> Window {
        verify_window(PAGE_BODY, PAGE_BODY, ATTESTED_TS).expect("the real window must verify")
    }

    fn events() -> Vec<Event> {
        let w = window();
        let mut e = parse_deposits(DEPOSIT_LIST, &w, USER_ID).unwrap();
        e.extend(parse_withdrawals(WITHDRAW_LIST, &w, USER_ID).unwrap());
        e.sort_by_key(|x| x.time);
        e
    }

    #[test]
    fn parses_the_scalar_user_id() {
        assert_eq!(parse_user_id(USER_ID).unwrap(), "9000000001");
        assert_eq!(parse_user_id("\"9000000001\"").unwrap(), "9000000001");
        assert!(parse_user_id("").is_err());
        assert!(parse_user_id("abc").is_err());
    }

    #[test]
    fn parses_the_snapshot() {
        let h = parse_holdings(TOKEN_LIST).unwrap();
        assert_eq!(h.len(), 1);
        assert_eq!(h[0].coin, "TKN");
        assert_eq!(h[0].amount, 100_000_000); // 1.0
        assert_eq!(h[0].valuation, 10_000_000_000); // 100.00
    }

    /// The withdrawal debit must include the fee, otherwise the reconstruction is short by exactly
    /// the fees and the pre-window balance goes spuriously negative.
    #[test]
    fn withdrawal_delta_includes_the_transaction_fee() {
        let ev = events();
        assert_eq!(ev.len(), 2);
        assert_eq!(ev[0].time, 1000864000000);
        assert_eq!(ev[0].delta, 200_000_000); // +2.0
        assert_eq!(ev[1].time, 1001728000000);
        assert_eq!(ev[1].delta, -100_000_000); // -(0.9 + 0.1 fee)
    }

    /// With the fee accounted for, the walk-back lands exactly on zero.
    #[test]
    fn reconstruction_is_exact() {
        let w = window();
        let h = parse_holdings(TOKEN_LIST).unwrap();
        let ev = events();
        let mut balance = h[0].amount;
        for e in ev.iter().rev() {
            balance -= e.delta;
        }
        assert_eq!(balance, 0, "pre-window balance must reconstruct to exactly 0");
        assert!(time_weighted_average_cents(&h, &ev, &w).is_ok());
    }

    /// Cross-checked independently with exact decimal arithmetic.
    #[test]
    fn computes_the_real_time_weighted_average() {
        let w = window();
        let h = parse_holdings(TOKEN_LIST).unwrap();
        assert_eq!(time_weighted_average_cents(&h, &events(), &w).unwrap(), 10_000);
    }

    #[test]
    fn window_checks_reject_tampering() {
        // span no longer 31 days
        let shifted = PAGE_BODY.replace("1000000000000", "1783604800000");
        assert!(verify_window(&shifted, &shifted, ATTESTED_TS).is_err());
        // a lower limit could silently truncate the feed
        let small = PAGE_BODY.replace("\"limit\":200", "\"limit\":10");
        assert!(verify_window(&small, &small, ATTESTED_TS).is_err());
        // a later page
        let paged = PAGE_BODY.replace("\"offset\":0", "\"offset\":200");
        assert!(verify_window(&paged, &paged, ATTESTED_TS).is_err());
        // deposit and withdraw feeds must describe the SAME window
        assert!(verify_window(PAGE_BODY, &shifted, ATTESTED_TS).is_err());
        // window pushed away from the attestation
        let future = r#"{"startTime":1885254399999,"endTime":1887932799998,"page":{"limit":200,"offset":0}}"#;
        assert!(verify_window(future, future, ATTESTED_TS).is_err());
    }

    #[test]
    fn rows_from_another_account_are_rejected() {
        let w = window();
        let other = DEPOSIT_LIST.replace("9000000001", "9000000002");
        assert!(parse_deposits(&other, &w, USER_ID).is_err());
    }

    #[test]
    fn unsettled_rows_are_skipped() {
        let w = window();
        let pending = DEPOSIT_LIST.replace("\"statusName\":\"Completed\"", "\"statusName\":\"Pending\"");
        assert!(parse_deposits(&pending, &w, USER_ID).unwrap().is_empty());
    }

    #[test]
    fn rows_outside_the_window_are_rejected() {
        let w = window();
        let outside = DEPOSIT_LIST.replace("1000864000000", "1700000000000");
        assert!(parse_deposits(&outside, &w, USER_ID).is_err());
    }

    /// Omitting a WITHDRAWAL collapses the implied earlier balance below zero and is rejected --
    /// but note this direction LOWERS the reported average, so it is the harmless case.
    #[test]
    fn omitted_withdrawal_is_rejected() {
        let w = window();
        let h = parse_holdings(TOKEN_LIST).unwrap();
        let only_dep = parse_deposits(DEPOSIT_LIST, &w, USER_ID).unwrap();
        assert!(time_weighted_average_cents(&h, &only_dep, &w).is_err());
    }

    /// THE REAL GAP, pinned so it cannot be quietly forgotten.
    ///
    /// Omitting a DEPOSIT leaves the implied earlier balance high, inflating the average from
    /// 10000 cents to 16451 -- and the residual stays positive, so nothing here fires. This is the
    /// profitable direction, and only completeness of the deposit feed defends against it.
    #[test]
    fn omitted_deposit_inflates_the_average_and_is_NOT_detected() {
        let w = window();
        let h = parse_holdings(TOKEN_LIST).unwrap();
        let truthful = time_weighted_average_cents(&h, &events(), &w).unwrap();
        let only_wd = parse_withdrawals(WITHDRAW_LIST, &w, USER_ID).unwrap();
        let inflated = time_weighted_average_cents(&h, &only_wd, &w)
            .expect("omitting a deposit is NOT rejected -- documented gap");
        assert_eq!(truthful, 10_000);
        assert_eq!(inflated, 16_451);
        assert!(inflated > truthful, "omitting a deposit overstates the average");
    }

    #[test]
    fn data_blob_is_three_plain_words() {
        let blob = abi_encode_three_words(10_000, 2678399999, 2);
        assert_eq!(blob.len(), 96);
        let w = |o: usize| u64::from_be_bytes(blob[o + 24..o + 32].try_into().unwrap());
        assert_eq!(w(0), 10_000);
        assert_eq!(w(32), 2678399999);
        assert_eq!(w(64), 2);
    }

    #[test]
    fn business_params_require_kaito_id() {
        assert_eq!(parse_business_params(br#"{"kaito_id":"k1"}"#).unwrap(), "k1");
        assert!(parse_business_params(br#"{}"#).is_err());
        assert!(parse_business_params(br#"{"wallet":"0xabc"}"#).is_err());
    }

    #[test]
    fn finds_signed_bodies_by_endpoint() {
        let extra: Value = serde_json::from_str(
            r#"{"requests[2].url":"https://x/bapi/capital/v1/private/capital/deposit/list",
                "requests[2].body":"DEP",
                "requests[3].url":"https://x/apex/web/portfolio/alpha/withdraw/history-list",
                "requests[3].body":"WD"}"#,
        )
        .unwrap();
        assert_eq!(signed_request_body(&extra, DEPOSIT_ENDPOINT).unwrap(), "DEP");
        assert_eq!(signed_request_body(&extra, WITHDRAW_ENDPOINT).unwrap(), "WD");
        assert!(signed_request_body(&extra, "/nope").is_err());
    }
}
