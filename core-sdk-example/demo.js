import {PrimusCoreTLS} from "@primuslabs/zktls-core-sdk";


async function primusProofTest() {
    // Initialize parameters, the init function is recommended to be called when the program is initialized.
    const appId = "YOUR_APPID";
    const appSecret= "YOUR_APPSECRET";
    const zkTLS = new PrimusCoreTLS();
    const initResult = await zkTLS.init(appId, appSecret);
    console.log("primusProof initResult=", initResult);

    // Set request and responseResolves.
    const request ={
        url: "https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=BTC-USD", // Request endpoint.
        method: "GET", // Request method.
        header: {}, // Request headers.
        body: "" // Request body.
    };
    // The responseResolves is the response structure of the url.
    // For example the response of the url is: {"data":[{ ..."instFamily": "","instType":"SPOT",...}]}.
    const responseResolves = [
        {
            keyName: 'instType', // According to the response keyname, such as: instType.
            parsePath: '$.data[0].instType', // According to the response parsePath, such as: $.data[0].instType.
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