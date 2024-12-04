const express = require('express');
const cors = require('cors');
const PrimusZKTLS = require('@fksyuan/zktls-js-sdk');

const app = express();
const port = 3000;

app.use(cors()); 

app.get('/primus/sign', async (req, res) => {
  const appId = "0x9d2b9084782bb148ac07684ac57d443bf8972b69";
  const appSecret= "0x415d013abe875b8819a0f61324e692342272b72f26509ccc2543bf5a7ea7fab4";
  const primusZKTLS = new PrimusZKTLS.default();
  await primusZKTLS.init(appId, appSecret);
  const signResult = await primusZKTLS.sign(req.query.signParams);
  res.json({signResult});
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
