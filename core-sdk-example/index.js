import ccxt from "ccxt";
import {PrimusCoreTLS} from "@primuslabs/zktls-core-sdk";
import {configDotenv} from "dotenv";
configDotenv()
const apiKey = process.env.API_KEY;
const secretKey = process.env.SECRET_KEY;
// check apiKey and secretKey
if (!apiKey || !secretKey) {
    console.log("Please set API_KEY and SECRET_KEY in .env file.");
    process.exit(1);
}

async function primusProofTest() {
    // Initialize parameters, the init function is recommended to be called when the program is initialized.
    const appId = "0x17ae11d76b72792478d7b7bcdc76da9574ab3cf8";
    const appSecret= "0xafa01caf44f07d2b21bc5e2bde1de2a8ba56f33ac2e223169f99634f57d049b5";
    const zkTLS = new PrimusCoreTLS();
    const initResult = await zkTLS.init(appId, appSecret);
    console.log("primusProof initResult=", initResult);

    const exchange = new ccxt['binance']({
        apiKey: apiKey,
        secret: secretKey,
    });
    let signParams = { recvWindow: 60 * 1000 };
    let res = exchange.sign('account', 'private', 'GET', signParams);
    const request ={
        url: res.url, // Request endpoint.
        method: res.method, // Request method.
        header: res.headers, // Request headers.
        body: "" // Request body.
    };
    // The responseResolves is the response structure of the url.
    // For example the response of the url is: {"data":[{ ..."instFamily": "","instType":"SPOT",...}]}.
    const responseResolves = [
        {
            keyName: 'balances', // According to the response keyname, such as: instType.
            parsePath: '$.balances', // According to the response parsePath, such as: $.data[0].instType.
	    op: 'SHA256',
        }
    ];
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
}

primusProofTest();
