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

## Client

Client refers to the web side. Developers can use the Primus zkTLS API to initiate an Attestation request. The main code file is this:https://github.com/primus-labs/zktls-demo/blob/main/production-example/client/src/primus.js

### Run

```bash
cd client
npm install
npm run dev
```

