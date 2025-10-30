const { PrimusNetwork } = require("@primuslabs/network-core-sdk");
const { ethers } = require("ethers");
require("dotenv/config");

async function primusProofTest() {
  const PRIVATEKEY = process.env.PRIVATE_KEY;
  const address = "0x8F0D4188307496926d785fB00E08Ed772f3be890";
  const chainId = 84532; // Base Sepolia (or 8453 for Base mainnet)
  const baseSepoliaRpcUrl = "https://sepolia.base.org"; // (or 'https://mainnet.base.org' for Base mainnet)
  // The request and response can be customized as needed.
  
  const requests = [
    {
      url: "https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=BTC-USD",
      method: "GET",
      header: {},
      body: "",
    }
  ];
  const responseResolves = [
    [
      {
        keyName: "instType",
        parseType: "json",
        parsePath: "$.data[0].instType",
        // op: "SHA256",
      },
    ],
  ];
  // const responseResolves = [
  //   [
  //     {
  //       keyName: "instIdCode",
  //       parseType: "json",
  //       parsePath: "$.data[0].instIdCode",
  //       op: "<",
  //       value: 200000,
  //     },
  //   ],
  // ];
  // const responseResolves = [
  //   [
  //     {
  //       keyName: "instType",
  //       parseType: "json",
  //       parsePath: "$.data[0].instType",
  //       op: "STREQ",
  //       value: "SPOT",
  //     },
  //   ],
  // ];

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
    const attestParams = {
      ...submitTaskParams,
      ...submitTaskResult,
      requests,
      responseResolves,
      // attMode: {
      //   algorithmType: "proxytls", // optional, default is 'proxytls'
      // },
      // getAllJsonResponse: "true", // optional, default is 'false',
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

    // const allJsonResponse = await primusNetwork.getAllJsonResponse(
    //   attestResult[0].taskId
    // );
    // console.log("allJsonResponse:", allJsonResponse);
  } catch (error) {
    console.error("Unexpected error:", error);
    throw error;
  }
}

primusProofTest();
