import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk";
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';
globalThis.Buffer = Buffer;

//Initialization parameters
const primusZKTLS = new PrimusZKTLS();
const appId = "YOUR_APPID";
const appSecret = "YOUR_APPSECRET";

primusZKTLS.init(appId, appSecret).then(
  (result) => {
    console.log("primusProof initAttestaionResult=", result);
  },
  (error) => {
    console.log(error);
  }
);

////////////////////////////////////////
//////////////////// Helpers Begin
// ref: https://github.com/primus-labs/zktls-att-verification/tree/brevis/src

function incrNonce(nonceBuffer) {
  for (let i = 3; i >= 0; i--) {
    if (nonceBuffer[i] === 255) {
      nonceBuffer[i] = 0;
    } else {
      nonceBuffer[i]++;
      break;
    }
  }
}

class Aes128Encryptor {
  constructor(keyBytes) {
    if (keyBytes.length !== 16) {
      throw new Error('AES-128 key must be 16 bytes.');
    }
    this.keyBytes = keyBytes;
  }

  static fromHex(hexKey) {
    const keyBytes = Buffer.from(hexKey, 'hex');
    return new Aes128Encryptor(keyBytes);
  }

  encryptBlock(inputBytes) {
    if (inputBytes.length !== 16) {
      throw new Error('ECB block encrypt requires 16 bytes input.');
    }
    const key = CryptoJS.lib.WordArray.create(this.keyBytes);
    const input = CryptoJS.lib.WordArray.create(inputBytes);
    const encrypted = CryptoJS.AES.encrypt(input, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.NoPadding,
    });

    const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
    return Uint8Array.from(Buffer.from(encryptedHex, 'hex'));
}

  // encryptBlock(inputBytes) {
  //   if (inputBytes.length !== 16) {
  //     throw new Error('ECB block encrypt requires 16 bytes input.');
  //   }

  //   const cipher = crypto.createCipheriv('aes-128-ecb', this.keyBytes, null);
  //   cipher.setAutoPadding(false);

  //   const encrypted = Buffer.concat([
  //     cipher.update(Buffer.from(inputBytes)),
  //     cipher.final()
  //   ]);

  //   return Uint8Array.from(encrypted);
  // }

  computeContinuousCounters(nonceBytes, totalLength) {
    const result = [];
    const nonceIndex = Buffer.alloc(4, 0);

    incrNonce(nonceIndex);

    while (result.length < totalLength) {
      incrNonce(nonceIndex);

      const fullNonce = Buffer.concat([
        Buffer.from(nonceBytes),
        nonceIndex
      ]);

      const encryptedCounter = this.encryptBlock(fullNonce);

      result.push(...encryptedCounter);
    }

    return Uint8Array.from(result.slice(0, totalLength));
  }
}

function hexToBytes(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

function bytesToUtf8(bytes) {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

class TLSRecord {
  constructor(ciphertext, nonce, jsonBlockPositions) {
    this.ciphertext = ciphertext;             // TLS record ciphertext (hex string)
    this.nonce = nonce;                       // TLS record nonce (hex string)
    this.jsonBlockPositions = jsonBlockPositions; // Array of [start, end] pairs
  }
}

class HTTPPacket {
  constructor(records) {
    this.records = records; // Array of TLSRecord
  }
}

class TLSData {
  constructor(packets) {
    this.packets = packets; // Array of HTTPPacket
  }

  async getFullPlainResponse(aesKeyHex) {
    const completeResponses = [];
    const cipher = await Aes128Encryptor.fromHex(aesKeyHex);

    for (const packet of this.packets) {
      let completeResponse = '';

      for (const record of packet.records) {
        const nonce = hexToBytes(record.nonce);
        const ciphertext = hexToBytes(record.ciphertext);
        const ciphertextLen = ciphertext.length;

        const counters = await cipher.computeContinuousCounters(nonce, ciphertextLen);

        const plaintextBytes = counters.map((counterByte, idx) => counterByte ^ ciphertext[idx]);
        const plaintext = bytesToUtf8(plaintextBytes);

        completeResponse += plaintext;
      }

      completeResponses.push(completeResponse);
    }

    return completeResponses;
  }
}
//////////////////// Helpers End
////////////////////////////////////////


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


  //=======================nillion backend can do like follows=======================
  // verify attestation
  const verifyResult = await primusZKTLS.verifyAttestation(attestation);
  console.log("verifyResult=", verifyResult);

  if (verifyResult === true) {
    // check url
    if (attestation.request.url.startsWith("https://www.binance.com/bapi/composite/v1/private/bigdata/finance/spot-statistics")
      || attestation.request.url.startsWith("https://www.binance.com/bapi/capital/v1/private/streamer/trade/get-user-trades")
      || attestation.request.url.startsWith("https://www.okx.com/priapi/v5/account/bills-archive"))
    {
      // decode response
      const data = JSON.parse(attestation.data)
      const parsed = JSON.parse(data.CompleteHttpResponseCiphertext)
      const tlsData = new TLSData(
        parsed.packets.map(packet => new HTTPPacket(
          packet.records.map(record => new TLSRecord(
            record.ciphertext,
            record.nonce,
            record.json_block_positions
          ))
        ))
      );
      const fullPlainResponse = await tlsData.getFullPlainResponse(aesKey);
      console.log("fullPlainResponse=", fullPlainResponse);
    } else {
      console.log("not support url");
    }
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
