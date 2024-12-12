import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk"

//Initialization parameters
const primusZKTLS = new PrimusZKTLS();
const appId = "0x17ae11d76b72792478d7b7bcdc76da9574ab3cf8";
const appSecret= "0xafa01caf44f07d2b21bc5e2bde1de2a8ba56f33ac2e223169f99634f57d049b5";
const initAttestaionResult = await primusZKTLS.init(appId, appSecret);
console.log("primusProof initAttestaionResult=", initAttestaionResult);

export async function primusProofTest() {
    //Set TemplateID and user address
    const attTemplateID = "044feebb-19e7-4152-a0a6-404b81f65ee4";
    const userAddress = "0x7ab44DE0156925fe0c24482a2cDe48C465e47573";
    //Generate attestation request
    const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);

    // request.setAttMode({
    //     algorithmType: "proxytls"
    // });
    
    // Transfer request object to string
    const requestStr = request.toJsonString();

    //sign request
    const signedRequestStr = await primusZKTLS.sign(requestStr);
    
    //start attestation process
    const attestation = await primusZKTLS.startAttestation(signedRequestStr);
    console.log("attestation=", attestation);

    //verify siganture
    const verifyResult = await primusZKTLS.verifyAttestation(attestation)
    console.log("verifyResult=", verifyResult);

    if (verifyResult === true) {
        // Business logic checks, such as attestation content and timestamp checks
        // do your own business logic
    } else {
        //not the primus sign, error business logic
    }
}