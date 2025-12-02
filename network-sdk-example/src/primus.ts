import { PrimusNetwork } from "@primuslabs/network-js-sdk";
import jp from 'jsonpath';
import { ethers } from "ethers";

const ethersUtils = ethers.utils;

const attTemplateID = "2e3160ae-8b1e-45e3-8c59-426366278b9d"; // x Account Ownership
const templateMetaInfo = {
  field: 'screen_name',
  jsonPath: '$.screen_name'
}
void templateMetaInfo; 

//Initialization parameters
const primusNetwork = new PrimusNetwork();
const CHAINID = 84532;

// Use MetaMask provider and selected account
let userAddress = "";
let wallet;
const connectWalletFn = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    // Ensure account access
    const accs = await web3Provider.send("eth_requestAccounts", []);
    wallet = web3Provider.getSigner();
    // wallet = window.ethereum;
    userAddress = accs[0];
    try {
      await web3Provider.send("wallet_switchEthereumChain", [
        { chainId: "0x" + CHAINID.toString(16) },
      ]);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await web3Provider.send("wallet_addEthereumChain", [
            {
              chainId: "0x" + CHAINID.toString(16),
              chainName: "Base Sepolia",
              rpcUrls: ["https://sepolia.base.org"],
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
              blockExplorerUrls: ["https://sepolia.basescan.org"],
            },
          ]);
        } catch (addError) {
          console.error("Failed to add chain", addError);
        }
      } else {
        console.error("Failed to switch chain", switchError);
      }
    }
  } else {
    throw new Error(
      "MetaMask not detected. Please install and enable MetaMask in your browser"
    );
  }
}
await connectWalletFn()

// 1. Initialize
const initRes = await primusNetwork.init(wallet, CHAINID);
console.log("SDK initialized", initRes);

export async function main(onComplete: any, onStepChange: any) {
  try {
    // 2. Submit task, set TemplateID and user address.
    onStepChange(1)
    const submitTaskParams = {
      templateId: attTemplateID,
      address: userAddress,
    };
    const submitTaskResult: any = await primusNetwork.submitTask(submitTaskParams);
    console.log("Task submitted:", submitTaskResult);

    // 3. Perform attestation
    onStepChange(2)
    const attestParams = {
      ...submitTaskParams,
      ...submitTaskResult,
      // extendedParams: JSON.stringify({ attUrlOptimization: true }), //Optional,optimization the url of attestation.
      // allJsonResponseFlag: 'true', // Optional,check () for details
      // attConditions: [
      //   [
      //     {
      //       field: templateMetaInfo.field,
      //       op: "SHA256",
      //     },
      //   ],
      // ]
    };
    const attestResult = await primusNetwork.attest(attestParams);
    const [attestationItem] = attestResult
    console.log("Attestation completed:", attestResult);

    // 4. Verify & poll task result
    onStepChange(3)
    const verifyAndPollTaskResultParams: any = {
      taskId: attestationItem.taskId,
      reportTxHash: attestationItem.reportTxHash,
    };
    const taskResult = await primusNetwork.verifyAndPollTaskResult(
      verifyAndPollTaskResultParams
    );
    console.log("Final result:", taskResult);

    //  optional get http response
    // const allJsonResponse: any = primusNetwork.getAllJsonResponse(attestParams.taskId);
    // console.log("allJsonResponse:", allJsonResponse);
    // const [formatJson, verifyResponseHashRes] = verifyResponseHashFn(allJsonResponse, templateMetaInfo.jsonPath, attestationItem)
    // onComplete(attestationItem, formatJson, verifyResponseHashRes);
    onComplete(attestationItem);
    onStepChange(4)

  } catch (error) {
    console.error("Main flow error:", error);
  }
}




const verifyResponseHashFn: (allJsonResponse: any, jsonPath: string, attestationItem: any) => any = (allJsonResponse, jsonPath, attestationItem) => {
  let formatJson: any = {}
  let res = false
  const formatResponseStr = allJsonResponse[0].content
  const formatResponseObj = isJsonString(formatResponseStr) ? JSON.parse(formatResponseStr) : formatResponseStr
  formatJson = jp.query(formatResponseObj, jsonPath)[0]
  const formatJsonStr = isJsonString(formatJson) ? JSON.stringify(formatJson) : formatJson;
  console.log('formatJsonStr', formatJsonStr)
  console.log("allJsonResponse:", allJsonResponse, formatJson);
  let formatJsonHash = ethersUtils.sha256(ethersUtils.toUtf8Bytes(formatJsonStr));
  formatJsonHash = formatJsonHash.startsWith('0x') ? formatJsonHash.slice(2) : formatJsonHash;
  console.log('formatJsonHash', formatJsonHash)
  // const attestationDataHash = JSON.parse(attestationItem.attestation.data)[templateMetaInfo.field]
  const attestationDataHash = Object.values(JSON.parse(attestationItem.attestation.data))[0]
  console.log('attestationDataHash', attestationDataHash)
  if (formatJsonHash === attestationDataHash) {
    console.log('Hash verification succeeded.')
    res = true
  }
  return [formatJson, res]
}
void verifyResponseHashFn; 

/**
 * Determine whether a string is a JSON string
 * @param {string} str
 * @returns {boolean} true=JSON string
 */
export function isJsonString(str: string) {
  if (typeof str !== 'string' || str.trim() === '') {
    return false;
  }
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null;
  } catch (error) {
    return false;
  }
}
