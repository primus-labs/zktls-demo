import PrimusZKTLS from "@fksyuan/zktls-js-sdk"

export async function primusProof() {
    console.log("primusProof");
    const primusZKTLS = new PrimusZKTLS();

    const appId = "0x9d2b9084782bb148ac07684ac57d443bf8972b69";
    const initAttestaionResult = await primusZKTLS.init(appId);
    console.log("primusProof initAttestaionResult=", initAttestaionResult);

    const attTemplateID = "8898dfb9-68a3-464c-890b-d75e1b26791a";
    const userAddress = "0x7ab44DE0156925fe0c24482a2cDe48C465e47573";
    const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);
    request.setAdditionParams(JSON.stringify({key1:"value1"}));
    const requestStr = request.toJsonString();

    const response = await fetch(`http://localhost:3000/primus/sign?signParams=${requestStr}`);
    const responseJson = await response.json();
    const signedRequestStr = responseJson.signResult;

    const attestation = await primusZKTLS.startAttestation(signedRequestStr);
    console.log("attestation=", attestation);
}