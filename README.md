# zktls-demo
The Primus zkTLS demo consists of some type examples:
* The Test Example(just for test): https://github.com/primus-labs/zktls-demo/tree/main/test-example
* The Production Example: https://github.com/primus-labs/zktls-demo/tree/main/production-example
* The Backend Integration Example: https://github.com/primus-labs/zktls-demo/tree/main/core-sdk-example

## Test Example vs Production Example

Both examples implement the same attestation flow (`generateRequestParams` -> `sign` -> `startAttestation` -> `verifyAttestation`). The difference is **where the attestation request is signed and where the App Secret lives**.

| | Test Example | Production Example |
|---|---|---|
| Architecture | Frontend only | Client (web) + Server (Node.js/Express) |
| Where `sign()` runs | In the browser, via `primusZKTLS.sign()` | On the backend: the client sends the request params to the server's `/primus/sign` endpoint and receives the signed result |
| App Secret location | Frontend `.env` (`VITE_APP_SECRET`), bundled into client-side code | Server-side `.env` (`APP_SECRET`) only; the client is initialized with the App ID alone |
| App Secret exposure | **Exposed to anyone who opens the page** - acceptable only for local testing | Never leaves the server |
| Use when | Quickly trying out the SDK and a template locally | Building anything users will access |

**Never ship the test-example pattern to production.** The App Secret is a credential for your Primus project: if it is embedded in frontend code, anyone can extract it from the bundle and sign attestation requests on behalf of your app. In production, keep the App Secret on a backend you control and expose only a signing endpoint to your client, as shown in the production example.



