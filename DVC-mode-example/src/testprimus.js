import {PrimusZKTLS} from "@primuslabs/zktls-js-sdk";

//Initialization parameters
const primusZKTLS = new PrimusZKTLS();
const appId = "0x17ae11d76b72792478d7b7bcdc76da9574ab3cf8";
const appSecret= "0xafa01caf44f07d2b21bc5e2bde1de2a8ba56f33ac2e223169f99634f57d049b5";

let platformDevice = "pc";
if (navigator.userAgent.toLocaleLowerCase().includes("android")) {
    platformDevice = "android";
} else if (navigator.userAgent.toLocaleLowerCase().includes("iphone")) {
    platformDevice = "ios";
}

primusZKTLS.init(appId, appSecret, {platform: platformDevice}).then(
    (result) => {
        console.log("platformDevice=", platformDevice, navigator.userAgent);
        console.log("primusProof initAttestaionResult=", result);
    },
    (error) => {
        console.log(error);
    }
);

export async function primusProofTest(attTemplateID) {
    //Set TemplateID and user address
    // const attTemplateID = "044feebb-19e7-4152-a0a6-404b81f65ee4";
    const userAddress = "0x7ab44DE0156925fe0c24482a2cDe48C465e47573";
    const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);
    request.setComputeMode("nonecomplete");

    const requestStr = request.toJsonString();
    const signedRequestStr = await primusZKTLS.sign(requestStr);

    const attestation = await primusZKTLS.startAttestation(signedRequestStr);
    console.log("attestation=", attestation);

    let extendedData = JSON.parse(primusZKTLS.getExtendedData(request.requestid));
    const aesKey = JSON.parse(extendedData.CompleteHttpResponseCiphertext).packets[0].aes_key;
    console.log("aesKey=", aesKey);

    const verifyResult = await primusZKTLS.verifyAttestation(attestation);
    console.log("verifyResult=", verifyResult);

    if (verifyResult === true) {
    //    const zkVmRequestData = {
    //     attestationData: {
    //         public_data: attestation,
    //         private_data: {
    //             aes_key: aesKey
    //         }
    //     },
    //     requestid: request.requestid
    //   };
    //   console.log("zkVmRequestData=", zkVmRequestData);

    // //   const zkVMServerUrl = "http://35.198.243.131:38080/";
    //   try {
    //     const sendZkVmRes = await postJson('/zktls/prove', zkVmRequestData);
    //     console.log("sendZkVmRes=", sendZkVmRes);
    //     if (sendZkVmRes.code !== '0') {
    //         return;
    //     }
    //   } catch (error) {
    //     console.log("send request error.");
    //   }

    //   const timer = setInterval(async () => {
    //     try {
    //         const getZkVmRes = await postJson('/zktls/result', {requestid: request.requestid});
    //         console.log("getZkVmRes=", getZkVmRes);
    //         if (getZkVmRes.code === '0' && (getZkVmRes.details.status === 'done' || getZkVmRes.details.status === 'error')) {
    //             clearInterval(timer);
    //             if (getZkVmRes.details.status === 'done') {
    //                 const pv_file = getZkVmRes.details.pv_file;
    //                 console.log("pv_file=", pv_file);
    //             }
    //         }
    //     } catch (error) {
    //         console.log("query result error.");
    //     }
    //   }, 5000);
    } else {
        //not the primus sign, error business logic
    }
}

async function postJson(url, data, headers = {}) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    // console.log("response=", response);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('POST request failed:', err);
    throw err;
  }
}
