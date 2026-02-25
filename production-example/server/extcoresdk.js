require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { PrimusExtCoreTLS } = require("@primuslabs/zktls-ext-core-sdk");

const app = express();
const port = 9000;

// Just for test, developers can modify it.
app.use(cors());

// Listen to the client's signature request and sign the attestation request.
app.get("/primus/sign", async (req, res) => {
  const appId = process.env.APP_ID;
  const appSecret = process.env.APP_SECRET;

  // Create a PrimusZKTLS object.
  const zkTLS = new PrimusExtCoreTLS();

  // Set appId and appSecret through the initialization function.
  await zkTLS.init(appId, appSecret);

  // Sign the attestation request.
  const signParams = decodeURIComponent(req.query.signParams);
  console.log("signParams=", signParams);
  const signResult = await zkTLS.sign(signParams);
  console.log("signResult=", signResult);

  //Return signed result.
  res.json({ signResult });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});