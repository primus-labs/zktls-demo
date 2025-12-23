const { PrimusNetwork } = require("@primuslabs/network-core-sdk");
const { ethers } = require("ethers");
require("dotenv/config");

async function primusProofTest() {
  const PRIVATEKEY = process.env.PRIVATE_KEY;
  const address = "0x8F0D4188307496926d785fB00E08Ed772f3be890"; // change to your address
  const chainId = 84532; // Base Sepolia (or 8453 for Base mainnet)
  const baseSepoliaRpcUrl = "https://sepolia.base.org"; // (or 'https://mainnet.base.org' for Base mainnet)
  // The request and response can be customized as needed.
  
  // change to your request params
  const requests = [
    {
      url: "https://checkout.mtls.api.hm.bb.com.br/",
      method: "GET", 
      header: {},
      body: "",
    }
  ];
  const responseResolves = [
    [
      {
        keyName: "detail",  // change to your response key name
        parseType: "json",
        parsePath: "$.detail", // change to your response json path
      },
    ],
  ];

  const provider = new ethers.providers.JsonRpcProvider(baseSepoliaRpcUrl);
  const wallet = new ethers.Wallet(PRIVATEKEY, provider);

  try {
    const primusNetwork = new PrimusNetwork();

    // Initialize the network with wallet
    const initResult = await primusNetwork.init(wallet, chainId);

    // Submit task
    const submitTaskParams = {
      address,
    };
    let submitTaskResult = await primusNetwork.submitTask(submitTaskParams);
    console.log("Submit task result:", submitTaskResult);

    // Compose params for attest
    const mTLS = {
      clientCrt: "YourClientCrtString", // Please replace with your ownner client crt string
      clientKey: "YourClientKeyString", // Please replace with your ownner client key string
    }
    const attestParams = {
      ...submitTaskParams,
      ...submitTaskResult,
      requests,
      responseResolves,
      mTLS
    };
    let attestResult = await primusNetwork.attest(attestParams);
    console.log("Attest result:", attestResult);

    // Verify and poll task result
    const verifyParams = {
      taskId: attestResult[0].taskId,
      reportTxHash: attestResult[0].reportTxHash,
    };
    const taskResult = await primusNetwork.verifyAndPollTaskResult(
      verifyParams
    );
    console.log("Task result:", taskResult);

  } catch (error) {
    console.error("Unexpected error:", error);
    throw error;
  }
}

primusProofTest();
