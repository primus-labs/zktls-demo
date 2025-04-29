import { useState, useCallback } from "react";
import "./App.css";
import { primusProofTest } from "./primus";
import { Button, Typography, Input } from "antd";
import { JsonView } from "react-json-view-lite";

const { Title } = Typography;

function App() {
  const [channelLogin, setChannelLogin] = useState("");

  const [doingAttestation, setIsDoingAttestation] = useState(false);
  const [attestation, setAttestation] = useState({});
  const [error, setError] = useState({});

  const startAttestation = async () => {
    if (!channelLogin) {
      //It's not displayName but login， you can find it from twitch api on webpage
      alert("You must input a channel name");
      return;
    }
    if (doingAttestation) {
      return;
    }
    console.log("start attestation!");
    setIsDoingAttestation(true);
    try {
      await primusProofTest(channelLogin, (attestation) => {
        setAttestation(attestation);
      });
    } catch (e: any) {
      // console.error(e);
      setError(e);
    } finally {
      setIsDoingAttestation(false);
    }
  };

  const onChangeChannelName = useCallback((e: any) => {
    setChannelLogin(e.target.value);
  }, []);

  return (
    <div>
      <div className="container">
        <div>
          <Title level={3} className="main-title">
            Demo - Twitch Channel Subscription
          </Title>
        </div>
        <div>
          <div className="card">
            <div className="inputWrapper">
              <Input
                placeholder="Insert verify channel name"
                value={channelLogin}
                onChange={onChangeChannelName}
              />
            </div>

            <Button
              type="primary"
              onClick={startAttestation}
              className="start-button"
              loading={doingAttestation}
            >
              Start
            </Button>
          </div>
        </div>
      </div>

      <JsonView
        data={attestation || error}
        style={{
          container: "my-json-container",
        }}
      />
    </div>
  );
}

null;

export default App;
