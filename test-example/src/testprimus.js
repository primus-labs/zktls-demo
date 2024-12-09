import { PrimusZKTLS } from "@fksyuan/zktls-js-sdk"

//Initialization parameters
const primusZKTLS = new PrimusZKTLS();
const appId = "0x9d2b9084782bb148ac07684ac57d443bf8972b69";
const appSecret= "0x415d013abe875b8819a0f61324e692342272b72f26509ccc2543bf5a7ea7fab4";
const initAttestaionResult = await primusZKTLS.init(appId, appSecret);
console.log("primusProof initAttestaionResult=", initAttestaionResult);

export async function primusProofTest() {
    //Set TemplateID and user address
    const attTemplateID = "9ee43a1c-dd2e-4342-ada9-d610ddb09983";
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