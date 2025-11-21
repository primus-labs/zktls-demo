import { useState } from "react";
import { primusProofTest } from "./primus";
import { Button, Typography } from "antd";
import { JsonView } from "react-json-view-lite";
import "./App.css";

const { Title } = Typography;

function App() {
  const [doingAttestation, setIsDoingAttestation] = useState(false);
  const [attestation, setAttestation] = useState({});
  const [hashVerification, setHashVerification] = useState(false);
  const [error, setError] = useState({});

  const startAttestation = async () => {
    if (doingAttestation) {
      return;
    }
    setAttestation({});
    setError({});
    console.log("start attestation!");
    setIsDoingAttestation(true);
    try {
      await primusProofTest((attestation, hashR) => {
        setAttestation(attestation);
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
        <div>
          <Title level={3} className="main-title">
            Demo - SSA
          </Title>
        </div>
        <div>
          <div className="card">
            <Button
              type="primary"
              onClick={startAttestation}
              className="start-button"
              loading={doingAttestation}
            >
              Start
            </Button>
            {Object.keys(attestation).length > 0 && (
              <div className="descItems">
                <div className="descItem">
                  <div className="label">Verification result:</div>
                  <div className="value">Success</div>
                </div>
                <div className="descItem">
                  <div className="label">Hash verification result:</div>
                  <div className={`value ${hashVerification ? "" : "failed"}`}>
                    {hashVerification ? "Success" : "Failed"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {Object.keys(attestation).length > 0 && (
        <JsonView
          data={attestation}
          style={{
            container: "my-json-container",
          }}
        />
      )}
      {Object.keys(error).length > 0 && (
        <JsonView
          data={error}
          style={{
            container: "my-json-container",
          }}
        />
      )}
    </div>
  );
}

null;

export default App;
