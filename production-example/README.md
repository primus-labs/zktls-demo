# zktls-demo production
The Primus zkTLS demo consists of two parts: server and client. You can run it with the following command.

## Server

Listen to the client's signature request and sign the attestation request. The main code file is this: https://github.com/primus-labs/zktls-demo/blob/main/production-example/server/index.js.

### Run

```bash
cd server
npm install
node index.js
```

### Configuration

Before running the server, you need to configure the following parameters:

#### App ID and App Secret
The **App ID** and **App Secret** can be obtained from:
- [Primus Developer Hub - My Projects](https://dev.primuslabs.xyz/myDevelopment/myProjects)
- Create a new project or use an existing one to get your App ID and App Secret

Copy `.env.example` to `.env` in the `server` directory and set `APP_ID` and `APP_SECRET` to your values. The `.env` file is listed in `.gitignore` and will not be committed—do not commit it to the repository.

## Client

Client refers to the web side. Developers can use the Primus zkTLS API to initiate an Attestation request. The main code file is this:https://github.com/primus-labs/zktls-demo/blob/main/production-example/client/src/primus.js

### Run

```bash
cd client
npm install
npm run dev
```

### Configuration

Before running the client, you need to configure the following parameters:

#### App ID
The **App ID** can be obtained from:
- [Primus Developer Hub - My Projects](https://dev.primuslabs.xyz/myDevelopment/myProjects)
- Create a new project or use an existing one to get your App ID

Copy `.env.example` to `.env` in the `client` directory and set `VITE_APP_ID` to your value. The `.env` file is listed in `.gitignore` and will not be committed—do not commit it to the repository.

#### Attestation Template ID
The **Attestation Template ID** (`attTemplateID`) in `client/src/primus.js` (line 7) can be obtained from:
- [Primus Marketplace](https://dev.primuslabs.xyz/marketplace) - Browse and select a template from the marketplace
- Or create your own custom template in the developer dashboard

## Important Notes

⚠️ **Note**: The **App ID** used by the server (in `server/.env`) and the client (in `client/.env` as `VITE_APP_ID`) must be the same. Make sure both `.env` files use the same App ID value.
