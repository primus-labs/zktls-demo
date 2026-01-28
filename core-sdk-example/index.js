import {PrimusCoreTLS} from "@primuslabs/zktls-core-sdk";

async function primusProofTest() {
    try {
        // Initialize parameters, the init function is recommended to be called when the program is initialized.
        const appId = "YOUR_APPID";
        const appSecret= "YOUR_APPSECRET";
        const zkTLS = new PrimusCoreTLS();
        const initResult = await zkTLS.init(appId, appSecret);
        console.log("primusProof initResult=", initResult);

        let request = {
            url: "https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=BTC-USD",
            method: "GET",
            header: {},
            body: "",
        };
        
        const responseResolves = [{
            keyName: "instType",
            parseType: "json",
            parsePath: "$.data[0].instType"
        }]

        // Generate attestation request.
        const generateRequest = zkTLS.generateRequestParams(request, responseResolves);

        // Set zkTLS mode, default is proxy model. (This is optional)
        generateRequest.setAttMode({
            algorithmType: "proxytls"
        });

        console.log("start attestation!")
        // Start attestation process.
        const attestation = await zkTLS.startAttestation(generateRequest);
    
        console.log("attestation=", attestation);
        
        const verifyResult = zkTLS.verifyAttestation(attestation);
        console.log("verifyResult=", verifyResult);
        if (verifyResult === true) {
            // Business logic checks, such as attestation content and timestamp checks
            // do your own business logic.
        } else {
            // If failed, define your own logic.
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Attestation error:', error);
        if (error?.code) {
            console.error(`${error?.code}: ${error?.message}`);
        } else {
            console.error('Attestation process failed, please check the console');
        }
        process.exit(1);
    }
}

primusProofTest();
