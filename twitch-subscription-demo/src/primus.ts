import {PrimusZKTLS} from "@primuslabs/zktls-js-sdk";
import { PrimusContractAbi } from "./primusContractAbi";
import { ethers } from "ethers";

// Initialize parameters.
const primusZKTLS = new PrimusZKTLS();

const appId = import.meta.env.VITE_APP_ID;
const appSecret = import.meta.env.VITE_APP_SECRET;
if (!appId || !appSecret) {
  alert("Missing VITE_APP_ID or VITE_APP_SECRET. Copy .env.example to .env and set your credentials.");
  throw new Error("Missing VITE_APP_ID or VITE_APP_SECRET. Copy .env.example to .env and set your credentials.");
}

const initAttestaionResult = await primusZKTLS.init(appId, appSecret);
console.log("primusProof initAttestaionResult=", initAttestaionResult);

export async function primusProofTest(channelName: string,callback: (attestation: string) => void) {
    // Set TemplateID and user address.
    const attTemplateID = "515fd5af-49be-48e7-9345-d949c76e5f0d";
    // ***You change address according to your needs.***
    const userAddress = "0x7ab44DE0156925fe0c24482a2cDe48C465e47573";
    // Generate attestation request.
    const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);
    request.setAttConditions([
      [
        {
          type: "CONDITION_EXPANSION",
          op: "MATCH_ONE",
          key: "login",
          field: "$[0].data.currentUser.subscriptionBenefits.edges[*]+",
          value: [
            {
              type: "FIELD_RANGE",
              op: "STREQ",
              field: "+.node.user.login",
              value: channelName,
            },
          ],
        },
      ],
    ]);
    // request.setAttMode({
    //     algorithmType: "proxytls"
    // });

    // Transfer request object to string.
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
        callback(attestation);

        const contractAddress = "0xCE7cefB3B5A7eB44B59F60327A53c9Ce53B0afdE";
        const provider = new ethers.providers.JsonRpcProvider(
          "https://rpc.basecamp.t.raas.gelato.cloud"
        );
        const contract = new ethers.Contract(contractAddress, PrimusContractAbi, provider);
        try {
          // Call verifyAttestation func
          await contract.verifyAttestation(attestation);
          console.log("verify Attestation on chain true");
        } catch (error) {
          console.error("Error in verifyAttestation:", error);
        }
    } else {
        // If failed, define your own logic.
    }
}