import { Text, View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { PrimusCoreTLS } from '@primuslabs/zktls-reactnative-core-sdk';


export default function App() {
  const [initResult, setInitResult] = useState("");
  const [attResult, setAttResult] = useState("");
  const [verifyResult, setVerifyResult] = useState("");
  useEffect(() => {
    async function init() {
      // production
      const appId = process.env.APP_ID ?? '';
      const appSecret = process.env.APP_SECRET ?? '';
      if (!appId || !appSecret) {
        setInitResult('Error: APP_ID and APP_SECRET must be set in .env');
        return;
      }
      try {

        // Initialize parameters, the init function is recommended to be called when the program is initialized.
        const zkTLS = new PrimusCoreTLS();
        const initResult = await zkTLS.init(appId, appSecret);
        console.log("primusProof initResult=", initResult);
        setInitResult(initResult.toString());

        // Set request and responseResolves.
        let request = {
          url: "https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=BTC-USD",
          method: "GET",
          header: {},
          body: ""
        };
        // The responseResolves is the response structure of the url.
        // For example the response of the url is: {"data":[{ ..."instFamily": "","instType":"SPOT",...}]}.
        const responseResolves = [
          {
            keyName: 'instType',
            parsePath: '$.data[0].instType',
            parseType: 'string'
          }
        ];

        // Generate attestation request.
        const generateRequest = zkTLS.generateRequestParams(request, responseResolves);
        console.log("-------------generateRequestParams result=", generateRequest);

        // Set zkTLS mode, default is proxy model. (This is optional)
        generateRequest.setAttMode({
          algorithmType: "proxytls"
        });

        // Transfer request object to string.
        const generateRequestStr = generateRequest.toJsonString();

        // Sign request.
        const signedRequestStr = await zkTLS.sign(generateRequestStr);

        // Start attestation process.
        const attestation = await zkTLS.startAttestation(signedRequestStr);
        setAttResult(JSON.stringify(attestation));
        console.log("attestation=", attestation);

        const verifyResult = zkTLS.verifyAttestation(attestation);
        setVerifyResult(JSON.stringify(verifyResult));
        console.log("verifyResult=", verifyResult);
        if (verifyResult === true) {
          // Business logic checks, such as attestation content and timestamp checks
          // do your own business logic.
        } else {
          // If failed, define your own logic.
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  return (
    <View style={styles.container}>
      <ResultLabel label="Init Result" value={initResult} />
      <ResultLabel label="Attestation Result" value={attResult} />
      <ResultLabel label="Verify Result" value={verifyResult} />
    </View>
  );
}

const ResultLabel = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.resultItem}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  resultItem: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  value: {
    fontSize: 15,
    color: '#666',
  },
});

