import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk";
import jp from 'jsonpath';
import { ethers } from "ethers";

const ethersUtils = ethers.utils;

// console.log(hash);
// Initialize parameters.
const primusZKTLS = new PrimusZKTLS();

//**** Set appId and appSecret here!!!
const appId = "0x17ae11d76b72792478d7b7bcdc76da9574ab3cf8";
const appSecret =
  "0xafa01caf44f07d2b21bc5e2bde1de2a8ba56f33ac2e223169f99634f57d049b5";
if (!appId || !appSecret) {
  alert("appId or appSecret is not set.")
  throw new Error("appId or appSecret is not set.");
}

const initAttestaionResult = await primusZKTLS.init(appId, appSecret);
console.log("primusProof initAttestaionResult=", initAttestaionResult);

export async function primusProofTest(callback: (attestation: string, verifyHashRes?: boolean) => void) {
  // Set TemplateID and user address.
  const attTemplateID = "d4d19cb5-8765-471b-b977-258b57120700";
  // ***You change address according to your needs.***
  const userAddress = "0x7ab44DE0156925fe0c24482a2cDe48C465e47573";
  // Generate attestation request.
  const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);

  request.setAllJsonResponseFlag("true");
  const attConditions = [
    [
      {
        field: "earningsSummary",
        op: "SHA256",
      },
    ],
  ];
  request.setAttConditions(attConditions);

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

    const verifyResponseHashFn = () => {
      const allJsonResponse: any = primusZKTLS.getAllJsonResponse(
        attestation.requestid
      );
      const formatResponseStr = allJsonResponse[0].content
      const formatResponseObj = JSON.parse(formatResponseStr)
      const formatJson = jp.query(formatResponseObj, '$.earningsSummary.earnings')[0]
      const formatJsonStr = JSON.stringify(formatJson);
      console.log("allJsonResponse:", allJsonResponse, formatJson);
      let formatJsonHash = ethersUtils.sha256(ethersUtils.toUtf8Bytes(formatJsonStr));
      formatJsonHash = formatJsonHash.startsWith('0x') ? formatJsonHash.slice(2) : formatJsonHash;
      console.log('formatJsonHash', formatJsonHash)
      const attestationDataHash = Object.values(JSON.parse(attestation.data))[0]
      console.log('attestationDataHash', attestationDataHash)
      if (formatJsonHash === attestationDataHash) {
        console.log('Hash verification succeeded.')
        return true
      }
    }
    const verifyResponseHashRes = verifyResponseHashFn()
    callback(attestation, verifyResponseHashRes);
  } else {
    // If failed, define your own logic.
  }
}