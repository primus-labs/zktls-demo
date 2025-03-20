import { PrimusPageCoreTLS } from "@fksyuan/zktls-page-core-sdk"

export async function primusProofTest() {
    // Initialize parameters.
    const primusZKTLS = new PrimusPageCoreTLS();
    const appId = "0x17ae11d76b72792478d7b7bcdc76da9574ab3cf8";
    const appSecret= "0xafa01caf44f07d2b21bc5e2bde1de2a8ba56f33ac2e223169f99634f57d049b5";
    const initAttestaionResult = await primusZKTLS.init(appId, appSecret);
    console.log("primusProof initAttestaionResult=", initAttestaionResult);

    let request ={
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
    const generateRequest = primusZKTLS.generateRequestParams(request, responseResolves);
    // Set zkTLS mode, default is proxy model. (This is optional)
    generateRequest.setAttMode({
        algorithmType: "proxytls",
        resultType: "plain"
    });

    // Transfer request object to string.
    const generateRequestStr = generateRequest.toJsonString();

    // Sign request.
    const signedRequestStr = await primusZKTLS.sign(generateRequestStr);

    // For Production Example: Get signed resopnse from backend.
    // const response = await fetch(`http://localhost:9000/primus/sign?signParams=${encodeURIComponent(generateRequestStr)}`);
    // const responseJson = await response.json();
    // const signedRequestStr = responseJson.signResult;

    // Start attestation process.
    const attestation = await primusZKTLS.startAttestation(signedRequestStr);
    console.log("attestation=", attestation);

    const verifyResult = primusZKTLS.verifyAttestation(attestation);
    console.log("verifyResult=", verifyResult);
    if (verifyResult === true) {
        // Business logic checks, such as attestation content and timestamp checks
        // do your own business logic.
    } else {
        // If failed, define your own logic.
    }
}