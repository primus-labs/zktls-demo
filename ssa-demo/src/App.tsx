import { useState, useMemo } from "react";
import { primusProofTest } from "./primus";
import { Button, Typography, Card, Descriptions } from "antd";
import "./App.css";

const { Title } = Typography;

function App() {
  const [doingAttestation, setIsDoingAttestation] = useState(false);
  const [attestation, setAttestation] = useState({})
  // const [attestation, setAttestation] = useState({
  //   recipient: "0x7ab44DE0156925fe0c24482a2cDe48C465e47573",
  //   request: {
  //     url: "https://auth-api.primuslabs.xyz/ec2/eligibility-earnings-api/earnings/summary",
  //     header: "",
  //     method: "GET",
  //     body: "",
  //   },
  //   reponseResolve: [
  //     {
  //       keyName: "earningsSummary",
  //       parseType: "",
  //       parsePath: "$.earningsSummary.earnings",
  //     },
  //   ],
  //   data: '{"SHA256($.earningsSummary.earnings)":"d8219d4a984157fa3be80c856911a84453907567cb563f7190a5edce34a80520"}',
  //   attConditions: '[{"op":"SHA256","field":"$.earningsSummary.earnings"}]',
  //   timestamp: 1763715677265,
  //   additionParams: '{"algorithmType":"proxytls"}',
  //   attestors: [
  //     {
  //       attestorAddr: "0xdb736b13e2f522dbe18b2015d0291e4b193d8ef6",
  //       url: "https://primuslabs.xyz",
  //     },
  //   ],
  //   signatures: [
  //     "0x3813fbc62d573d55bcdd08589c54a7f224461bc5b7abb504d17032207bf96a8c5bdb90f79e10fbf0b4a2fe05092d3932596483f37d9c7ae2d38aa1f05b82cb251c",
  //   ],
  //   requestid: "d96cf4d5-c616-452a-bd4b-8baae50f4845",
  // });
  const [jsonResponse, setJsonResponse] = useState({});
  const [hashVerification, setHashVerification] = useState(false);
  const [error, setError] = useState({});
  const items = useMemo(() => {
    return [
      {
        label: "Attestation verification result",
        children: <span className="text-green-600">Success</span>,
      },
      {
        label: "Hash verification result",
        children: hashVerification ? (
          <span className="text-green-600">Success</span>
        ) : (
          <span className="	text-red-600">Failed</span>
        ),
      },
    ];
  }, [hashVerification]);

  const startAttestation = async () => {
    if (doingAttestation) {
      return;
    }
    setAttestation({});
    setJsonResponse({});
    setError({});
    console.log("start attestation!");
    setIsDoingAttestation(true);
    try {
      await primusProofTest((attestation, jsonResponse, hashR) => {
        setAttestation(attestation);
        setJsonResponse(jsonResponse);
        setHashVerification(!!hashR);
      });
    } catch (e: any) {
      // console.error(e);
      setError(e);
    } finally {
      setIsDoingAttestation(false);
    }
  };

  return (
    <div>
      <div className="container">
        <Title level={3} className="main-title">
          Demo - SSA
        </Title>

        <Button
          type="primary"
          onClick={startAttestation}
          className="start-button"
          loading={doingAttestation}
        >
          Start
        </Button>
        {Object.keys(attestation).length > 0 && (
          <Descriptions bordered items={items} className="w-full mt-6" />
        )}
      </div>
      {Object.keys(attestation).length > 0 && (
        <Card
          title="Attestation Result"
          className=" mt-6 bg-gray-50"
          size="small"
        >
          <pre className="bg-white p-4 rounded-lg overflow-auto max-h-96 text-xs border border-gray-200">
            {JSON.stringify(attestation, null, 2)}
          </pre>
        </Card>
      )}
      {Object.keys(jsonResponse).length > 0 && (
        <Card
          title="Client Plain Response"
          className=" mt-6 bg-gray-50"
          size="small"
        >
          <pre className="bg-white p-4 rounded-lg overflow-auto max-h-96 text-xs border border-gray-200">
            {JSON.stringify(jsonResponse, null, 2)}
          </pre>
        </Card>
      )}
      {Object.keys(error).length > 0 && (
        <Card
          title="Attestation Result"
          className=" mt-6 bg-gray-50"
          size="small"
        >
          <pre className="bg-white p-4 rounded-lg overflow-auto max-h-96 text-xs border border-gray-200">
            {JSON.stringify(error, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

null;

export default App;
