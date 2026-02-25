# network-core-sdk example

The Primus network-core-sdk demo. You can run it with the following command.

## Run

```bash
npm install
node index.js
```

## Configuration

Before starting the attestation, you need to configure the following parameters:

### Private Key

The **PRIVATE_KEY** is the Ethereum wallet private key used to sign transactions (e.g. for Base Sepolia). It is required to run the example.

### App ID and App Secret (optional)

If needed, **App ID** and **App Secret** can be obtained from:

- [Primus Developer Hub - My Projects](https://dev.primuslabs.xyz/myDevelopment/myProjects)
- Create a new project or use an existing one to get your App ID and App Secret

### Setup

Copy `.env.example` to `.env` in this directory and set `PRIVATE_KEY` (and optionally `APP_ID` and `APP_SECRET`) to your values.

**Important:** The `.env` file is listed in `.gitignore` and will not be committed. Do not commit it to the repository so that your credentials are not exposed to others.
