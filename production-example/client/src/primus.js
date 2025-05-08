import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk"

// Initialize parameters.
const primusZKTLS = new PrimusZKTLS();
const appId = "0x17ae11d76b72792478d7b7bcdc76da9574ab3cf8";
// const initAttestaionResult = await primusZKTLS.init(appId);
// If it is running on a mobile terminal, you need to pass the platform parameter. The default platform is PC. If you add the following configuration, it can run on both PC and mobile terminals.
let platformDevice = "pc";
if (navigator.userAgent.toLocaleLowerCase().includes("android")) {
    platformDevice = "android";
} else if (navigator.userAgent.toLocaleLowerCase().includes("iphone")) {
    platformDevice = "ios";
}
const initAttestaionResult = await primusZKTLS.init(appId, "", {platform: platformDevice});
console.log("primusProof initAttestaionResult=", initAttestaionResult);

export async function primusProof() {
    // Set TemplateID and user address.
    const attTemplateID = "2e3160ae-8b1e-45e3-8c59-426366278b9d";
    const userAddress = "0x7ab44DE0156925fe0c24482a2cDe48C465e47573";
    // Generate attestation request
    const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);
    
    // Set additionParams. (This is optional)
    const additionParams = JSON.stringify({"additionParamsKey1":"additionParamsVaule1"});
    request.setAdditionParams(additionParams);
   
    // Set tls mode, default is proxy model. (This is optional)
    const proxyMode = "proxytls"
    request.setAttMode({
        algorithmType: proxyMode
    });

    // Transfer request object to string.
    const requestStr = request.toJsonString();

    // Get signed resopnse from backend.
    const response = await fetch(`http://localhost:9000/primus/sign?signParams=${requestStr}`);
    const responseJson = await response.json();
    const signedRequestStr = responseJson.signResult;
    
    // Start attestation process.
    const attestation = await primusZKTLS.startAttestation(signedRequestStr);
    console.log("attestation=", attestation);

    // Verify siganture
    const verifyResult = await primusZKTLS.verifyAttestation(attestation)
    console.log("verifyResult=", verifyResult);

    if (verifyResult === true) {
        // Business logic checks, such as attestation content and timestamp checks
        // do your own business logic
    } else {
        // If failed, define your own logic.
    }
}