import { PrimusCoreTLS } from "@primuslabs/zktls-core-sdk";
import "dotenv/config";
import { guardAttestation, NullifierStore, AttestationGuardError } from "./agentGuard.js";

// The endpoint this agent is built around. Pinning it (and the response parse
// paths below) is what lets the agent notice if the template later starts
// producing valid proofs for a different endpoint or response shape.
const ENDPOINT = "https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=BTC-USD";
const PARSE_PATH = "$.data[0].instType";

// Agent policy: how the attestation must look before the agent will act on it.
const POLICY = {
  maxAgeMs: 30_000, // reject attestations older than 30s
  clockSkewMs: 5_000,
  schema: {
    url: ENDPOINT,
    method: "GET",
    parsePaths: [PARSE_PATH],
  },
  // Persist this across runs in production (DB or on-chain nullifier map).
  nullifierStore: new NullifierStore(),
};

async function agentProofFlow() {
  try {
    const appId = process.env.APP_ID;
    const appSecret = process.env.APP_SECRET;
    if (!appId || !appSecret) {
      throw new Error("Missing APP_ID or APP_SECRET. Copy .env.example to .env and set your credentials.");
    }

    const zkTLS = new PrimusCoreTLS();
    const initResult = await zkTLS.init(appId, appSecret);
    console.log("primusProof initResult=", initResult);

    const request = {
      url: ENDPOINT,
      method: "GET",
      header: {},
      body: "",
    };
    const responseResolves = [
      { keyName: "instType", parseType: "json", parsePath: PARSE_PATH },
    ];

    const generateRequest = zkTLS.generateRequestParams(request, responseResolves);
    generateRequest.setAttMode({ algorithmType: "proxytls" });

    console.log("start attestation!");
    const attestation = await zkTLS.startAttestation(generateRequest);
    console.log("attestation=", attestation);

    // Step 1: signature verification (unchanged from the core-sdk example).
    const verifyResult = zkTLS.verifyAttestation(attestation);
    console.log("verifyResult=", verifyResult);
    if (verifyResult !== true) {
      console.error("Signature verification failed - not acting on this attestation.");
      process.exit(1);
    }

    // Step 2: agent-side usability checks. This is the "do your own business
    // logic" step made concrete: freshness + schema pin + replay protection.
    try {
      const { nullifier } = await guardAttestation(attestation, POLICY);
      console.log("guard passed, nullifier=", nullifier);
    } catch (e) {
      if (e instanceof AttestationGuardError) {
        // A signed, internally-valid attestation that the agent still must not
        // act on. For an autonomous agent this is the important branch.
        console.error(`Attestation rejected by guard [${e.reason}]: ${e.message}`);
        console.error("details=", e.details);
        process.exit(2);
      }
      throw e;
    }

    // Step 3: only now is it safe for the agent to act on attestation data.
    console.log("Attestation is verified, fresh, schema-matched and unused - safe to act on.");

    process.exit(0);
  } catch (error) {
    console.error("Attestation error:", error);
    if (error?.code) {
      console.error(`${error?.code}: ${error?.message}`);
    }
    process.exit(1);
  }
}

agentProofFlow();
