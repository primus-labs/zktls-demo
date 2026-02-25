# Primus Network SDK Demo
## How to run 
### Install chrome extension
Install the extension from the [Chrome extension store](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe)  
Required Version: ≥ 0.3.44

### Configuration

Before running the demo, configure environment variables if the SDK or example requires app credentials:

**App ID and App Secret** (reserved for when the SDK needs them) can be obtained from:
- [Primus Developer Hub - My Projects](https://dev.primuslabs.xyz/myDevelopment/myProjects)
- Create a new project or use an existing one to get your App ID and App Secret

**Setup:** Copy `.env.example` to `.env` in this directory and set `VITE_APP_ID` and `VITE_APP_SECRET` to your values. If the current example does not use these yet, they are reserved for future use when the SDK requires them.

**Important:** The `.env` file (and `.env.local`, `.env.*.local`) is listed in `.gitignore` and will not be committed. Do not commit these files to the repository so that your credentials are not exposed to others.

### Create an Template on the [Developer platform](https://dev.primuslabs.xyz/myDevelopment/myTemplates/new)
1. Save your TemplateId
2. Configure them by setting the values in [primus.ts](./src/primus.ts)

### Install Dependencies
```bash
npm install
```

### Start the Application
```bash
 npm run dev
```
1. Open your browser and navigate to: http://127.0.0.1:5173/
2. Click the appropriate button to proceed.

