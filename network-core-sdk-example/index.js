const { PrimusNetwork } = require("@primuslabs/network-core-sdk");
const { ethers } = require("ethers");

const PRIVATEKEY = "";
async function primusProofTest() {
  const chainId = 84532; // Base Sepolia
  const baseSepoliaRpcUrl = "https://sepolia.base.org";
  //   const chainId = 8453; // Base mainnet
  //   const baseSepoliaRpcUrl = 'https://mainnet.base.org';
  // Create a real provider for Base Sepolia

  if (!PRIVATEKEY) {
    console.log("Skipping test: PRIVATEKEY not set");
    return;
  }
  const provider = new ethers.providers.JsonRpcProvider(baseSepoliaRpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  // Test parameters
  const testAddress = "0x810b7bacEfD5ba495bB688bbFD2501C904036AB7"; // Example address
  const attestParams = {
    address: testAddress,
  };

  try {
    const primusNetwork = new PrimusNetwork();
    // Initialize the network with wallet (signer)
    // const initResult = await primusNetwork.init(wallet, chainId, "wasm"); // "wasm" is optional, default is "c++"
    const initResult = await primusNetwork.init(wallet, chainId);

    // Submit task (now with a proper signer)
    let submitResult = await primusNetwork.submitTask(attestParams);
    console.log("Submit task result:", submitResult);

    // let submitResult = {
    //     taskId: '0x64acec552247298dbd39017a50625f262a38b9de37723bb8b7fa645fda2e2b4d',
    //     taskTxHash: '0x8753e26c144377cb68c1c70f1ea73e2ef1841d9d61381c15307c990e0acf8c61',
    //     taskAttestors: [ '0x93c6331d08a898eb9E08FC9CE91B3Ec60d1735bF' ]
    // };
    const requests = [
      {
        url: "https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=BTC-USD",
        method: "GET",
        header: {},
        body: "",
      },
    ];
    const responseResolves = [
      [
        {
          keyName: "instType",
          parseType: "json",
          parsePath: "$.data[0].instType",
        },
      ],
    ];

    // Compose params for attest
    const attestParams2 = {
      ...attestParams,
      ...submitResult,
      requests,
      responseResolves,
    };

    let attestResult = await primusNetwork.attest(attestParams2);

    console.log("Attest result:", attestResult);

    const taskResult = await primusNetwork.verifyAndPollTaskResult({
      taskId: attestResult[0].taskId,
      reportTxHash: attestResult[0].reportTxHash,
    });

    console.log("Task result:", taskResult);
  } catch (error) {
    console.error("Unexpected test error:", error);
    throw error;
  }
}
primusProofTest();
