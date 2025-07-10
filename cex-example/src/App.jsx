import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'


/** start: copy the dev hub code here */
import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk"







function App() {
  const [attestation, setAttestation] = useState();
  const [x, setX] = useState();

  async function primusProof() {
    try {
      // Initialize parameters, the init function is recommended to be called when the page is initialized.
      const primusZKTLS = new PrimusZKTLS();
      const appId = "0xa821cfa0f513cb6e5391ea119b4f758037c8264d";
      const appSecret = "0xdbc800897bc646f8dd674cc652a1c89c3572323b51d43e6feed7703b1275c381"; // Just for testing, appSecret cannot be written in the front-end code

      console.log("dddddd");
      const initAttestaionResult = await primusZKTLS.init(appId, appSecret);
      console.log("eeeee");
      // Set TemplateID and user address.
      const attTemplateID = "369e1db8-47c9-4dc6-85b5-037cd02d3383";
      const userAddress = "0xc814b5AACFB7F3400e90FFa4fC6BF5169E221f61";
      // Generate attestation request.
      const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);

      // Set zkTLS mode, default is proxy model. (This is optional)
      const workMode = "proxytls";
      request.setAttMode({
        algorithmType: workMode,
      });
      console.log("cccccccc");
      // Set attestation conditions. (These are optional)
      // 1. Hashed result.
      // const attConditions = JSON.stringify([
      //  [
      //   { 
      //     field:'YOUR_CUSTOM_DATA_FIELD',
      //     op:'SHA256',
      //   },
      //  ],
      // ]);
      // 2. Conditions result.\
      /*
       const attConditions = JSON.stringify([
        [
          {
            field: "$.data.cumulativeCurrMonth.spotPnlRate",
            op: ">",
            value: "1",  // PNL Rate >= 10% (=0.1): trader,  else: loser
          },
        ],
       ]);
       request.setAttConditions(attConditions);
      */
       request.setAttConditions([
        [
          {
            field: "spotPnlRate",
            op: ">",
            value: "0.1",  // PNL Rate >= 10% (=0.1): trader,  else: loser
          },
         ],
       ]);

      // Transfer request object to string.
      const requestStr = request.toJsonString();

      // Sign request.
      const signedRequestStr = await primusZKTLS.sign(requestStr);

      // Start attestation process.
      const attestation0 = await primusZKTLS.startAttestation(signedRequestStr);
      console.log("attestation=", attestation0);


      const spotPnlRate = JSON.parse(attestation0.data).spotPnlRate;
      console.log("spotPnlRate:", spotPnlRate); // -0.00100000

      setAttestation(attestation0);

      // Verify siganture.
      const verifyResult = await primusZKTLS.verifyAttestation(attestation0)
      console.log("verifyResult=", verifyResult);

      if (verifyResult === true) {
        // Business logic checks, such as attestation content and timestamp checks
        // do your own business logic.
        console.log("ababababababababab");
        
      } else {
        // If failed, define your own logic.
        console.log("efefefefefefefefef");
      }

    } catch (error) {

    }


  }

  /** end: copy the dev hub code here */


  const handleClick = () => {
    setX(attestation);

  };


  return (
    <div>

      <div>
        Hello Trader!
      </div>

      <div className="card">
        <button onClick={primusProof}>
          Prove your Binace 30-Day PNL Rate
        </button>
      </div>

      <hr />

      <div>

        <textarea value={JSON.stringify(x, null, 2)} readOnly rows="30" cols="70"></textarea>
        <br /><br />


        <button onClick={handleClick}>Show the attestation result</button>
      </div>

    </div>
  )
}

export default App
