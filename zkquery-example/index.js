const { PrimusCoreTLS } = require("@primuslabs/zktls-core-sdk");

async function primusProofTest() {
    // Initialize parameters.
    const appId = "0x17ae11d76b72792478d7b7bcdc76da9574ab3cf8";
    const appSecret= "0xafa01caf44f07d2b21bc5e2bde1de2a8ba56f33ac2e223169f99634f57d049b5";
    const zkTLS = new PrimusCoreTLS();
    // 
    const initResult = await zkTLS.init(appId, appSecret);
    console.log("primusProof initResult=", initResult);

    // Set request and responseResolves
    const request ={
        url: "https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=BTC-USD",
        method: "GET",
        header: {},
        body: ""
    };
    const responseResolves = [
        {
            keyName: 'instType',
            parsePath: '$.data[0].instType',
            parseType: 'string'
        }
    ];
    // Generate attestation request.
    const generateRequest = zkTLS.generateRequestParams(request, responseResolves);

    // Set zkTLS mode, default is proxy model. (This is optional)
    generateRequest.setAttMode({
        algorithmType: "proxytls"
    });

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
}

primusProofTest();