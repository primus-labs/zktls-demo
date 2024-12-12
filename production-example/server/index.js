const express = require('express');
const cors = require('cors');
const { PrimusZKTLS } = require('@primuslabs/zktls-js-sdk');

const app = express();
const port = 9000;

// Just for test, developers can modify it
app.use(cors()); 

// Listen to the client's signature request and sign the attestation request
app.get('/primus/sign', async (req, res) => {
  const appId = "0x9d2b9084782bb148ac07684ac57d443bf8972b69";
  const appSecret= "0x415d013abe875b8819a0f61324e692342272b72f26509ccc2543bf5a7ea7fab4";

  // Create a PrimusZKTLS object
  const primusZKTLS = new PrimusZKTLS();

  // Set appId and appSecret through the initialization function
  await primusZKTLS.init(appId, appSecret);

  // Sign the attestation request
  console.log("signParams=", req.query.signParams);
  const signResult = await primusZKTLS.sign(req.query.signParams);
  console.log("signResult=", signResult);

  // Return sign result
  res.json({signResult});
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
