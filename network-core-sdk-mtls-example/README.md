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

## Configuration

Before running the example, you need to configure the following parameters:

### Private Key
The **PRIVATE_KEY** is the Ethereum wallet private key used to sign transactions (e.g. for Base Sepolia). It is required to run the example.

### mTLS client key and certificate
For mTLS-protected endpoints you need:
- **CLIENT_KEY**: path to the client private key file, in PEM format (e.g. `-----BEGIN PRIVATE KEY-----...`).
- **CLIENT_CRT**: path to the client certificate file, in PEM format (e.g. `-----BEGIN CERTIFICATE-----...`).

Copy `.env.example` to `.env` in this directory and set `PRIVATE_KEY`, `CLIENT_KEY`, and `CLIENT_CRT` to your values. The `.env` file is listed in `.gitignore` and will not be committed—do not commit it to the repository.

```bash
cp .env.example .env
```

Example `.env`:
```sh
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
CLIENT_KEY=/path/to/your/client.key
CLIENT_CRT=/path/to/your/client.crt
```

**Security note**: keep the client key and `.env` private and stored securely; never commit them or share publicly.

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
