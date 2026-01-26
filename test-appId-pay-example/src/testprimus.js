// import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk"
import { PrimusZKTLS } from "@superorange/zka-js-sdk"


export async function primusProofTest(appId, appSecret, attTemplateID) {
    // Initialize parameters.
    const primusZKTLS = new PrimusZKTLS();
    
    // If it is running on a mobile terminal, you need to pass the platform parameter. The default platform is PC. If you add the following configuration, it can run on both PC and mobile terminals.
    let platformDevice = "pc";
    if (navigator.userAgent.toLocaleLowerCase().includes("android")) {
        platformDevice = "android";
    } else if (navigator.userAgent.toLocaleLowerCase().includes("iphone")) {
        platformDevice = "ios";
    }
    const initAttestaionResult = await primusZKTLS.init(appId, appSecret, {platform: platformDevice});
    console.log("primusProof initAttestaionResult=", initAttestaionResult);

    // Set TemplateID and user address.
    const userAddress = "0x7ab44DE0156925fe0c24482a2cDe48C465e47573";
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