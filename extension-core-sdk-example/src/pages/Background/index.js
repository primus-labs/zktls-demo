const { PrimusExtCoreTLS } = require("@primuslabs/zktls-ext-core-sdk");

console.log('This is the background page.');
console.log('Put the background scripts here.');

const zkTLS = new PrimusExtCoreTLS();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function bytesToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

// Convert browser-copied curl --data-raw ($'...') to base64 bytes.
// Special rule: treat literal 'ù' as raw byte 0xF9 (instead of UTF-8 C3 B9).
function curlDataRawToBase64(dataRawInput) {
    let raw = dataRawInput.trim();
    if (raw.startsWith("$'") && raw.endsWith("'")) {
        raw = raw.slice(2, -1);
    }

    const bytes = [];
    let i = 0;

    while (i < raw.length) {
        const ch = raw[i];

        if (ch === "\\") {
            const next = raw[i + 1];
            if (next == null) {
                break;
            }

            if (next === "n") {
                bytes.push(0x0a);
                i += 2;
                continue;
            }
            if (next === "r") {
                bytes.push(0x0d);
                i += 2;
                continue;
            }
            if (next === "t") {
                bytes.push(0x09);
                i += 2;
                continue;
            }
            if (next === "\\") {
                bytes.push(0x5c);
                i += 2;
                continue;
            }
            if (next === "'") {
                bytes.push(0x27);
                i += 2;
                continue;
            }
            if (next === "\"") {
                bytes.push(0x22);
                i += 2;
                continue;
            }
            if (next === "x") {
                const hex = raw.slice(i + 2, i + 4);
                if (/^[0-9a-fA-F]{2}$/.test(hex)) {
                    bytes.push(parseInt(hex, 16));
                    i += 4;
                    continue;
                }
            }
            if (next === "u") {
                const hex = raw.slice(i + 2, i + 6);
                if (/^[0-9a-fA-F]{4}$/.test(hex)) {
                    const codePoint = parseInt(hex, 16);
                    if (codePoint <= 0xff) {
                        bytes.push(codePoint);
                    } else {
                        bytes.push(...new TextEncoder().encode(String.fromCodePoint(codePoint)));
                    }
                    i += 6;
                    continue;
                }
            }

            // Unknown escape: keep escaped char as-is.
            bytes.push(...new TextEncoder().encode(next));
            i += 2;
            continue;
        }

        const codePoint = raw.codePointAt(i);
        if (codePoint === 0x00f9) {
            bytes.push(0xf9);
        } else {
            bytes.push(...new TextEncoder().encode(String.fromCodePoint(codePoint)));
        }
        i += codePoint > 0xffff ? 2 : 1;
    }

    return bytesToBase64(new Uint8Array(bytes));
}

async function primusProofTest() {
    const offscreenDocumentPath = 'offscreen.html';
    await chrome.offscreen.createDocument({
        url: chrome.runtime.getURL(offscreenDocumentPath),
        reasons: ['IFRAME_SCRIPTING'],
        justification: 'WORKERS for needing the document',
    });
    console.log(`${new Date().toLocaleString()} offscreen document created`);
    await delay(1000);

    // Initialize parameters, the init function is recommended to be called when the program is initialized.
    const appId = "0x17ae11d76b72792478d7b7bcdc76da9574ab3cf8";
    const appSecret= "0xafa01caf44f07d2b21bc5e2bde1de2a8ba56f33ac2e223169f99634f57d049b5";
    // test error code :-1002003
    // const appId = "0xf8fcf17da5822c7dd821815504d4ff3a05f9203b";
    // const appSecret = "0x977e8c99c04ec40d762b73abbb27443b4d441f3b1991ff3c6e1a83d7a8858de3"
    
    const initResult = await zkTLS.init(appId, appSecret, "debug");

    // For Production Example, init only need appId.
    //const initResult = await zkTLS.init(appId);

    console.log("primusProof initResult=", initResult);
}

primusProofTest();

chrome.action.onClicked.addListener((tab) => {
  showIndex();
});

const showIndex = (info, tab) => {
  let url = chrome.runtime.getURL('newtab.html');
  chrome.tabs.create({ url });
};

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log('background onMessage message', message);
    const { type, method} = message;
    if (type === "PrimusExtCoreTLS" && method === "startAttestation") {
        // example 1: single requestUrl
        // Set request and responseResolves.
        const request ={
            url: "https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=BTC-USD", // Request endpoint.
            method: "GET", // Request method.
            header: {}, // Request headers.
            body: "" // Request body.
        };
        // The responseResolves is the response structure of the url.
        // For example the response of the url is: {"data":[{ ..."instFamily": "","instType":"SPOT",...}]}.
        const responseResolves = [
            {
                keyName: 'instType', // According to the response keyname, such as: instType.
                parsePath: '$.data[0].instType', // According to the response parsePath, such as: $.data[0].instType.
                // op:'SHA256'
            }
        ];

        // example 2: batch requestUrl

        // let request = [
        //     {
        //         url: "https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=BTC-USD",
        //         method: "GET",
        //         header: {},
        //         body: "",
        //     },
        //     {
        //         url: "https://www.okx.com/api/v5/public/time",
        //         method: "GET",
        //         header: {},
        //         body: "",
        //     }
        // ];

        // const responseResolves = [
        //     [
        //         {
        //             keyName: "instIdCode",
        //             parseType: "json",
        //             parsePath: "$.data[0].instIdCode",
        //             // op: '>',
        //             // value: 0,
        //             // op: 'SHA256_EX',
        //         }
        //     ],
        //     [
        //         {
        //             keyName: "ts",
        //             parseType: "json",
        //             parsePath: "$.code",
        //             // op: 'STREQ',
        //             // value: '0',
        //             // op: 'SHA256_EX',
        //         }
        //     ]
        // ];

        // example 3 :base64 body example
        // const shopifyCurlDataRaw = String.raw`$'\nù\u0001FROM sessions\n  SHOW sessions\n  WHERE human_or_bot_session IN (\'human\', \'bot\')\n  TIMESERIES day WITH TOTALS, PERCENT_CHANGE\n  SINCE startOfDay(-30d) UNTIL today\n  COMPARE TO previous_period\n  ORDER BY day ASC\n  LIMIT 100\nVISUALIZE sessions TYPE line'`;
        // const request = [{
        //     url: "https://merchant-analytics-api.shopifyapps.com/twirp/proto.query.v1.QueryService/ShopifyQlQuery",
        //     method: "POST",
        //     header: {
        //         accept: "application/protobuf, application/json",
        //         "accept-language": "en",
        //         authorization: "Bearer xxx",
        //         "cache-control": "no-cache",
        //         "content-type": "application/protobuf",
        //         origin: "https://admin.shopify.com",
        //         pragma: "no-cache",
        //         priority: "u=1, i",
        //         referer: "https://admin.shopify.com/",
        //         "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
        //         "sec-ch-ua-mobile": "?0",
        //         "sec-ch-ua-platform": "\"macOS\"",
        //         "sec-fetch-dest": "empty",
        //         "sec-fetch-mode": "cors",
        //         "sec-fetch-site": "cross-site",
        //         "shopify-analytics-experience": "web:/",
        //         "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
        //     },
        //     body: curlDataRawToBase64(shopifyCurlDataRaw),
        //     "bodyEncoding": "base64",
        // }];
        // const responseResolves = [
        //     [
        //         {
        //             keyName: 'ShopifyQlQuery',
        //             parsePath: '$',
        //             op: "REVEAL_BASE64_STRING",
        //         }
        //     ]
        // ];

        // Generate attestation request.
        const generateRequest = zkTLS.generateRequestParams(request, responseResolves);
        // Set zkTLS mode, default is proxy model. (This is optional)
        generateRequest.setAttMode({
            algorithmType: "proxytls"
        });

        // Transfer request object to string.
        const generateRequestStr = generateRequest.toJsonString();

        // Sign request.
        const signedRequestStr = await zkTLS.sign(generateRequestStr);

        // For Production Example: Get signed resopnse from backend.
        // const response = await fetch(`http://localhost:9000/primus/sign?signParams=${encodeURIComponent(generateRequestStr)}`);
        // const responseJson = await response.json();
        // const signedRequestStr = responseJson.signResult;

        // Start attestation process.
        const attestation = await zkTLS.startAttestation(signedRequestStr);
        console.log("attestation=", attestation);

        const verifyResult = zkTLS.verifyAttestation(attestation);
        console.log("verifyResult=", verifyResult);
        if (verifyResult === true) {
            // Business logic checks, such as attestation content and timestamp checks
            // do your own business logic.
        } else {
            // If failed, define your own logic.
        }
    }
  });
