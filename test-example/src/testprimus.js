import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk"

// Initialize parameters.
const primusZKTLS = new PrimusZKTLS();
const appId = "YOUR_APPID";
const appSecret= "YOUR_APPSECRET";
const userAddress = "YOUR_USER_ADDRESS"; // 0x...
const attTemplateID = "2e3160ae-8b1e-45e3-8c59-426366278b9d";
//const initAttestaionResult = await primusZKTLS.init(appId, appSecret);

// If it is running on a mobile terminal, you need to pass the platform parameter. The default platform is PC. If you add the following configuration, it can run on both PC and mobile terminals.
let platformDevice = "pc";
if (navigator.userAgent.toLocaleLowerCase().includes("android")) {
    platformDevice = "android";
} else if (navigator.userAgent.toLocaleLowerCase().includes("iphone")) {
    platformDevice = "ios";
}
const initAttestaionResult = await primusZKTLS.init(appId, appSecret, {platform: platformDevice});
console.log("primusProof initAttestaionResult=", initAttestaionResult);

export async function primusProofTest() {
    // Generate attestation request.
    const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);

    // request.setAttMode({
    //     algorithmType: "proxytls"
    // });
    
    // Transfer request object to string.
    const requestStr = request.toJsonString();

    // Sign request.
    const signedRequestStr = await primusZKTLS.sign(requestStr);
    
    // Start attestation process.
    const attestation = await primusZKTLS.startAttestation(signedRequestStr);
    console.log("attestation=", attestation);

    // Verify siganture.
    const verifyResult = await primusZKTLS.verifyAttestation(attestation)
    console.log("verifyResult=", verifyResult);

    if (verifyResult === true) {
        // Business logic checks, such as attestation content and timestamp checks
        // do your own business logic.
    } else {
        // If failed, define your own logic.
    }
}