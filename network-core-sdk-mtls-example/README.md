# network-core-sdk-mtls-example

## Install
```bash
npm install
```

## Configure
Create a `.env` file in the project root:
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

## Run
```bash
node index.js
```

You should see logs for:
- submit task result
- attest result
- task result

## Customize
Edit these sections in `index.js`:
- `address`: your wallet address
- `chainId` and `baseSepoliaRpcUrl`: switch to Base mainnet if needed
- `requests`: request params for your mTLS endpoint
- `responseResolves`: JSON parse paths for the response fields you want to attest

## Notes
- Keep your `.env` out of version control.
- The example uses a public RPC; for reliability, use your own provider endpoint.
