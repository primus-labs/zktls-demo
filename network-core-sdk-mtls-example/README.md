# network-core-sdk-mtls-example

## About Primus Network-Core-SDK

When integrating data verification solutions into your **backend** server, you can utilize the [**Primus Network Core SDK**](https://docs.primuslabs.xyz/primus-network/build-with-primus/for-backend/simpleexample).

The Network-Core-SDK allows you to verify data through API endpoint responses. An authorized token or other credential is required to request private data if the data source server requires permissioned access. Note that in the backend integration situation, the developer usually proves their off-chain data in their built application, and the Primus extension is **not** required. Typical scenarios include proof of reserves, in which a configured web page periodically proves that the stablecoin issuer holds sufficient collateral across off-chain platforms.

For more details about Primus zkTLS, please refer to:
1. zkTLS technology link: https://docs.primuslabs.xyz/data-verification/tech-intro
2. Primus Network: https://docs.primuslabs.xyz/primus-network/understand-primus-network

## Install
```bash
npm install
```

## Configure
Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```

Then set your private key:
```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

Optional: if you want to enable mTLS, uncomment the `mTLS` block in `index.js` and provide your client cert/key strings:
```js
const mTLS = {
  clientCrt: "YourClientCrtString",
  clientKey: "YourClientKeyString",
};
```
Security note: keep the client key private and stored securely; never commit it or share it publicly.

## Customize
Edit these sections in `index.js`:
- `address`: your wallet address
- `requests`: request params for your mTLS endpoint
- `responseResolves`: JSON parse paths for the response fields you want to attest
- `chainId` and `baseSepoliaRpcUrl`: switch to Base mainnet if needed

## Run
```bash
node index.js
```

You should see logs for:
- submit task result
- attest result
- task result

## Notes
- Keep your `.env` out of version control.
- The example uses a public RPC; for reliability, use your own provider endpoint.
