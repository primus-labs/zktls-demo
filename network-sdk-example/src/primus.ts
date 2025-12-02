import { PrimusNetwork } from "@primuslabs/network-js-sdk";
import jp from 'jsonpath';
import { ethers } from "ethers";

const ethersUtils = ethers.utils;

const attTemplateID = "29c33c39-b81d-43b9-8868-7977cf1fe209";
const templateMetaInfo = {
  field: 'transactions',
  jsonPath: '$'
}
// test
// const attTemplateID = "df2a20f0-221a-4dcc-9ae9-fcfc9b7ed2b6";
// const templateMetaInfo = {
//   field: 'code',
//   jsonPath: '$'
// }

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
      allJsonResponseFlag: 'true',
      attConditions: [
        [
          {
            field: templateMetaInfo.field,
            op: "SHA256",
          },
        ],
      ]
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

    // get http response
    const allJsonResponse: any = primusNetwork.getAllJsonResponse(attestParams.taskId);
    console.log("allJsonResponse:", allJsonResponse);
    debugger
    const [formatJson, verifyResponseHashRes] = verifyResponseHashFn(allJsonResponse, templateMetaInfo.jsonPath, attestationItem) // optaional
    onStepChange(4)
    onComplete(attestationItem, formatJson, verifyResponseHashRes);
  } catch (error) {
    console.error("Main flow error:", error);
  }
}




const verifyResponseHashFn: (allJsonResponse: any, jsonPath: string, attestationItem: any) => any = (allJsonResponse, jsonPath, attestationItem) => {
  let formatJson = {}
  let res = false
  const formatResponseStr = allJsonResponse[0].content
  const formatResponseObj = JSON.parse(formatResponseStr)
  formatJson = jp.query(formatResponseObj, jsonPath)[0]
  const formatJsonStr = JSON.stringify(formatJson);
  // console.log('formatJsonStr', formatJsonStr)
  // console.log("allJsonResponse:", allJsonResponse, formatJson);
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