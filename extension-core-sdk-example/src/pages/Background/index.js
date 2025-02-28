const { PrimusExtCoreTLS } = require("@fksyuan/zktls-ext-core-sdk");

console.log('This is the background page.');
console.log('Put the background scripts here.');

const zkTLS = new PrimusExtCoreTLS();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
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
    const initResult = await zkTLS.init(appId, appSecret);

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
            }
        ];
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
