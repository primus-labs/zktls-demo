import PrimusZKTLS from "@fksyuan/zktls-js-sdk"

export async function primusProof() {
    console.log("primusProof");
    //Initialization parameters
    const primusZKTLS = new PrimusZKTLS();
    const appId = "0x9d2b9084782bb148ac07684ac57d443bf8972b69";
    const initAttestaionResult = await primusZKTLS.init(appId);
    console.log("primusProof initAttestaionResult=", initAttestaionResult);
    //set TemplateID and user address
    const attTemplateID = "8898dfb9-68a3-464c-890b-d75e1b26791a";
    const userAddress = "0x7ab44DE0156925fe0c24482a2cDe48C465e47573";
    //generate Request and send to the backend
    const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);
    request.setAdditionParams(JSON.stringify({key1:"value1"}));
    const requestStr = request.toJsonString();
    
    //set additionParams
    const additionParams = `{"userId":"22","url":"http://www.baidu.com"}`
    primusZKTLS.setAdditionParams(additionParams);
    //set mode 
    const proxyMode = "proxytls"
    primusZKTLS.setAttMode({
        algorithmType: proxyMode
    });

    //get resopnse form backend
    const response = await fetch(`http://localhost:3000/primus/sign?signParams=${requestStr}`);
    const responseJson = await response.json();
    const signedRequestStr = responseJson.signResult;
    //do primus protocol
    const attestation = await primusZKTLS.startAttestation(signedRequestStr);
    console.log("attestation=", attestation);

    //verify siganture
    const verifyResult = await primusZKTLS.verifyAttestation(attestation)
    console.log("verifyResult=", verifyResult);

    if (verifyResult === true){
        // attestation business logic check for example:
        // 1.timestamp is legal 
        // 2.verifer user name or follower number is over x num etc..
        // then do your own business logic
    }else{
        //not the primus sign
    }
}