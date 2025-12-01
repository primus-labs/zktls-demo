import { useState, useMemo, useCallback } from "react";
import { main } from "./primus";
import { Button, Typography, Card, Descriptions, Steps } from "antd";
import {
  LoadingOutlined,
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "./App.css";

const { Title } = Typography;

function App() {
  const [doingAttestation, setIsDoingAttestation] = useState(false);
  const [attestation, setAttestation] = useState({});
  const [step, setStep] = useState(0);

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
      await main(
        (attestation: any, jsonResponse: any, flag: boolean) => {
          setAttestation(attestation);
          setJsonResponse(jsonResponse);
          setHashVerification(flag);
        },
        (step: number) => {
          setStep(step);
        }
      );
    } catch (e: any) {
      // console.error(e);
      setError(e);
    } finally {
      setIsDoingAttestation(false);
    }
  };
  const getStatus = useCallback(
    (activeStep: number) => {
      if (step < activeStep) {
        return "wait";
      } else if (step === activeStep) {
        return "process";
      } else if (step > activeStep) {
        return "finish";
      }
    },
    [step]
  );
  const getIcon = useCallback(
    (activeStep: number) => {
      if (getStatus(activeStep) === "process") {
        return <LoadingOutlined />;
      } else {
        let iconEl = <SmileOutlined />;
        switch (activeStep) {
          case 1:
            iconEl = <UserOutlined />;
            break;
          case 2:
            iconEl = <SolutionOutlined />;
            break;
          case 3:
            iconEl = <SmileOutlined />;
            break;
        }
        return iconEl;
      }
    },
    [step]
  );

  return (
    <div className="w-full">
      <div className="container">
        <Title level={3} className="main-title">
          Demo - Primus Network SDK
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
        {step > 0 && (
          <Steps
            className="w-full mt-6"
            items={[
              {
                title: "Submit Task",
                status: getStatus(1),
                icon: getIcon(1),
              },
              {
                title: "Verify",
                status: getStatus(2),
                icon: getIcon(2),
              },
              {
                title: "Confirm",
                status: getStatus(3),
                icon: getIcon(3),
              },
            ]}
          />
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
        <Card title="Error" className=" mt-6 bg-gray-50" size="small">
          <pre className="bg-white p-4 rounded-lg overflow-auto max-h-96 text-xs border border-gray-200">
            {JSON.stringify(error, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

export default App;
