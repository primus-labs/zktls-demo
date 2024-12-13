const express = require('express');
const cors = require('cors');
const { PrimusZKTLS } = require('@primuslabs/zktls-js-sdk');

const app = express();
const port = 9000;

// Just for test, developers can modify it.
app.use(cors()); 

// Listen to the client's signature request and sign the attestation request.
app.get('/primus/sign', async (req, res) => {
  const appId = "0x17ae11d76b72792478d7b7bcdc76da9574ab3cf8";
  const appSecret= "0xafa01caf44f07d2b21bc5e2bde1de2a8ba56f33ac2e223169f99634f57d049b5";

  // Create a PrimusZKTLS object.
  const primusZKTLS = new PrimusZKTLS();

  // Set appId and appSecret through the initialization function.
  await primusZKTLS.init(appId, appSecret);

  // Sign the attestation request.
  console.log("signParams=", req.query.signParams);
  const signResult = await primusZKTLS.sign(req.query.signParams);
  console.log("signResult=", signResult);

  // Return signed result.
  res.json({signResult});
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
