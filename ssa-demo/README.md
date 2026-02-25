# SAS Demo
## How to run 
### Install chrome extension
Install the extension from the [Chrome extension store](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe)  
Required Version: ≥ 0.3.31

### Create an Application on the [Developer platform](https://dev.primuslabs.xyz/myDevelopment/myProjects)
1. Save your appId and appSecret
2. Configure them via environment variables (see **Configuration** below)

### Configuration

Before starting the attestation, you need to configure the following parameters:

#### App ID and App Secret
The **App ID** and **App Secret** can be obtained from:
- [Primus Developer Hub - My Projects](https://dev.primuslabs.xyz/myDevelopment/myProjects)
- Create a new project or use an existing one to get your App ID and App Secret

Copy `.env.example` to `.env` in this directory and set `VITE_APP_ID` and `VITE_APP_SECRET` to your values. The `.env` file is listed in `.gitignore` and will not be committed—do not commit it to the repository.

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

