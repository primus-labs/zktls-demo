# agent verification example

This example shows what an **autonomous agent** should check *after*
`zkTLS.verifyAttestation` returns `true`, before it acts on the attested data
(places an order, signs a transaction, etc.).

`verifyAttestation` confirms the attestor signature and that the attestation is
internally consistent. It does not, on its own, tell an agent whether the
attestation is:

- **fresh** enough to act on,
- **shaped** the way the agent expects (same endpoint and response schema), or
- **new** (not a replay of a proof already used in a previous run).

The core-sdk example ends with a comment - "Business logic checks, such as
attestation content and timestamp checks - do your own business logic." This
example is a concrete, reusable version of that step. A human looking at a
dashboard would notice a stale or wrong-looking value; an agent acting
automatically will not, so these checks matter more in the agent case.

## What it does

`agentGuard.js` is a small, dependency-free module with three checks:

| Check | Guards against |
|---|---|
| Freshness | Acting on a valid but stale attestation, or one dated in the future |
| Schema pin | An endpoint that silently changed meaning (units, spot vs mark price, aggregation) while still producing valid proofs |
| Replay | Re-using a proof from an earlier run to drive a new action |

`index.js` runs the standard attestation flow, then gates the data behind
`guardAttestation(...)` before treating it as safe to act on.

## Run

Signature verification and attestation generation need Primus credentials:

```bash
npm install
# copy .env.example to .env and set APP_ID / APP_SECRET
node index.js
```

The guard logic itself has no external dependencies and can be checked offline,
without credentials or network access:

```bash
npm test
```

## Configuration

### App ID and App Secret

Obtain these from the
[Primus Developer Hub - My Projects](https://dev.primuslabs.xyz/myDevelopment/myProjects).
Copy `.env.example` to `.env` in this directory and set `APP_ID` and
`APP_SECRET`. The `.env` file is gitignored - do not commit it.

### Agent policy

Edit `POLICY` in `index.js` to match your agent:

- `maxAgeMs` - maximum accepted attestation age (0 disables the age check).
- `schema.url` / `schema.method` / `schema.parsePaths` - the endpoint and
  response paths the agent is built around.
- `nullifierStore` - in-memory here; back it with a database or an on-chain
  nullifier map in production so replay protection survives restarts. For the
  on-chain equivalent, see the `AttestationGuard.sol` pattern in
  [primus-labs/zktls-contracts](https://github.com/primus-labs/zktls-contracts).
