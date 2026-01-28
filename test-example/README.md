# zktls-demo test

## Run
The main code file is this: https://github.com/primus-labs/zktls-demo/blob/main/test-example/src/testprimus.js

```bash
npm install
npm run dev
```

## Configuration

Before starting the attestation, you need to configure the following parameters in `src/testprimus.js`:

### App ID and App Secret
The **App ID** and **App Secret** in `src/testprimus.js` (lines 5-6) can be obtained from:
- [Primus Developer Hub - My Projects](https://dev.primuslabs.xyz/myDevelopment/myProjects)
- Create a new project or use an existing one to get your App ID and App Secret

### Attestation Template ID
The **Attestation Template ID** (`attTemplateID`) in `src/testprimus.js` (line 21) can be obtained from [Primus DevHub](https://dev.primuslabs.xyz/marketplace):
- Browse and select a template from the marketplace
- Or create your own custom template in the developer dashboard

