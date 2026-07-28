# zktls-zkvm-example

Drives a Primus zkTLS attestation and then proves over it in a zkVM: the attested data goes to the
[Brevis ZK Credit](https://zk-id.brevis.network) gateway, which runs a Pico guest circuit and
returns a proof plus the computed result.

Route under test: **`binance.avg_balance.v1`** — a 31-day time-weighted average Binance balance.

## Run

```bash
npm install
cp .env.example .env     # then fill it in, see Configuration
npm run dev
```

Open the page, click **Start Attestation (live)**, and watch the console. It logs three phases:

| prefix | what it shows |
|---|---|
| `[capture]` | every request URL, the negotiated reveal ops, and each reveal decoded |
| `[hash]` | `sha256(content ‖ salt)` per reveal, checked against the signed attestation |
| `[zkVM]` | submit → poll → decoded public values |

The `[hash]` phase is the guest's own binding check run locally, so a mismatch is caught in the
browser instead of surfacing as an opaque verification failure at the prover.

## Configuration

Copy `.env.example` to `.env` (it is gitignored — do not commit it):

| variable | where from |
|---|---|
| `VITE_APP_ID`, `VITE_APP_SECRET` | [Primus Developer Hub → My Projects](https://dev.primuslabs.xyz/myDevelopment/myProjects) |
| `VITE_RECIPIENT_ADDRESS` | your own `0x` address — the attestation recipient |

`VITE_RECIPIENT_ADDRESS` is only the attestation recipient. It is **not** an account identifier:
the guest derives its nullifier from the attested Binance `userId`, because keying on a
caller-supplied value would let one account mint unlimited distinct nullifiers.

## The template

`attTemplateID` in `src/testprimus.js` is
[`62df67c2-2ef7-45ca-bf67-72bdce5dc54b`](https://dev.primuslabs.xyz/marketplace), which issues
**four requests under one signature**:

```
[0] GET  accounts/v1/private/account/get-user-base-info
         reveal `userId`        $.data.userId
[1] GET  asset/v2/private/asset-service/wallet/asset
         reveal `tokenList`     $.data
[2] POST capital/v1/private/capital/deposit/list
         reveal `depositList`   $.data.rows
[3] POST apex/v1/private/apex/web/portfolio/alpha/withdraw/history-list
         reveal `withdrawList`  $.data.rows
```

Requests 2 and 3 are parameterised through `setAdditionParams` with the window and page
(`limit: 200`, `offset: 0`). Those land in the POST **body**, which is inside the signature
preimage, so the guest re-derives and constrains the window from signed data.

Three things about the SDK that fail silently and are worth knowing:

- `setAttConditions` takes an **array of arrays** — one inner array per request. Supplying a single
  inner array leaves the later requests with no reveal condition.
- each condition's `field` must equal the template's **data-item name**. A name that does not match
  is dropped **without error** and the template default applies instead.
- `getAllJsonResponse()` returns **whole response bodies**, but the salted hash is over the value
  **narrowed by `parsePath`**. Pairing a full body with its salt produces a hash that cannot match.
  `narrowForHash()` handles this; scalars are hashed bare, not quoted.

## No captured-data replay

There is deliberately no "prove a saved attestation" path. A real attestation cannot be
de-identified — the signature covers the account data — so shipping one would mean publishing
somebody's balances and reveal salts. Every run needs a live attestation.

## Reference guests

`src/*.rs` are **reference only** and are not what the gateway runs:

| file | production counterpart |
|---|---|
| `avg_balance_guest.rs` | `vm/app/src/providers/binance/avg_balance_v1/mod.rs` |
| `wallet_balance_guest.rs` | `vm/app/src/providers/binance/wallet_balance_v1/mod.rs` |

They are single-file illustrations of what a guest circuit looks like, with input parsing, request
binding and public-values encoding reimplemented inline so each file stands alone. Production
routes take all three from a shared `stable::` module instead, so they stay byte-identical across
routes — and their `ProveRequest` here does **not** match the real wire format
(`canonicalJSON(picoSerializedTaskInput)` inside a bincode stdin frame).

Their fixtures are synthetic. Tests that need a real signed attestation live with the production
routes, where the fixture is available.
