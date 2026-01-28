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

Before running the server, you need to configure the following parameters in `server/index.js`:

#### App ID and App Secret
The **App ID** and **App Secret** in `server/index.js` (lines 13-14) can be obtained from:
- [Primus Developer Hub - My Projects](https://dev.primuslabs.xyz/myDevelopment/myProjects)
- Create a new project or use an existing one to get your App ID and App Secret

## Client

Client refers to the web side. Developers can use the Primus zkTLS API to initiate an Attestation request. The main code file is this:https://github.com/primus-labs/zktls-demo/blob/main/production-example/client/src/primus.js

### Run

```bash
cd client
npm install
npm run dev
```

### Configuration

Before running the client, you need to configure the following parameters in `client/src/primus.js`:

#### App ID
The **App ID** in `client/src/primus.js` (line 5) can be obtained from:
- [Primus Developer Hub - My Projects](https://dev.primuslabs.xyz/myDevelopment/myProjects)
- Create a new project or use an existing one to get your App ID

#### Attestation Template ID
The **Attestation Template ID** (`attTemplateID`) in `client/src/primus.js` (line 7) can be obtained from:
- [Primus Marketplace](https://dev.primuslabs.xyz/marketplace) - Browse and select a template from the marketplace
- Or create your own custom template in the developer dashboard

## Important Notes

⚠️ **Note**: The **App ID** in `server/index.js` and `client/src/primus.js` must be the same. Make sure both files use the same App ID value.
