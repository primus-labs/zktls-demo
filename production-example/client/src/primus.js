import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk"

//Initialization parameters
const primusZKTLS = new PrimusZKTLS();
const appId = "0x9d2b9084782bb148ac07684ac57d443bf8972b69";
const initAttestaionResult = await primusZKTLS.init(appId);
console.log("primusProof initAttestaionResult=", initAttestaionResult);

export async function primusProof() {
    //Set TemplateID and user address
    const attTemplateID = "8898dfb9-68a3-464c-890b-d75e1b26791a";
    const userAddress = "0x7ab44DE0156925fe0c24482a2cDe48C465e47573";
    //Generate attestation request
    const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);
    
    //Set additionParams(this is option)
    const additionParams = JSON.stringify({"additionParamsKey1":"additionParamsVaule1"});
    request.setAdditionParams(additionParams);
   
    //Set tls mode, default is proxy model. (this is option)
    const proxyMode = "proxytls"
    request.setAttMode({
        algorithmType: proxyMode
    });

    // Transfer request object to string
    const requestStr = request.toJsonString();

    //get sign resopnse form backend
    const response = await fetch(`http://localhost:9000/primus/sign?signParams=${requestStr}`);
    const responseJson = await response.json();
    const signedRequestStr = responseJson.signResult;
    
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