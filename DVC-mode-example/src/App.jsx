import {useEffect, useState} from "react";
import "./App.css";
import {primusProofTest} from "./testprimus";
import {Button, Form, Input, Modal, Select, Typography} from "antd";

const {Title} = Typography;

function App() {
    const [templateId, setTemplateId] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [canAttestation, setCanAttestation] = useState(false);
    const [doingAttestation, setIsDoingAttestation] = useState(false);
    const [templateStates, setTemplateStates] = useState([]);
    const templates = [
        {
            templateId: "c25c9f6a-b816-4a67-86ab-7292eff209a3",
            name: "7-Day Spot Trade History",
            source: "Binance",
        },
        {
            templateId: "369e1db8-47c9-4dc6-85b5-037cd02d3383",
            name: "30-day Spot Account PnL Rate",
            source: "Binance",
        },
        {
            templateId: "de40b2ec-f26a-4dcd-a16d-869c55cbf400",
            name: "7-Day Trade History",
            source: "OKX",
        },
        {
            templateId: "4871f96f-10e1-43e1-93f3-2f7ef4d551db",
            name: "Spot 30-Day Trade Volume",
            source: "bitget",
        },
        {
            templateId: "9f4baccf-bc8b-47e1-a000-b1412e010a78",
            name: "Spot Trade History",
            source: "Bitget",
        }
    ];

    useEffect(() => {
        const item = sessionStorage.getItem("privateTemplates");
        if (item) {
            setTemplateStates([...templates, ...JSON.parse(item)]);
        } else {
            setTemplateStates(templates);
        }
    }, []);

    const startAttestation = async () => {
        setCanAttestation(false);
        console.log("start attestation!");
        setIsDoingAttestation(true);
        if (!templateId) {
            alert("Please select a template!");
            setCanAttestation(true);
            setIsDoingAttestation(false);
            return;
        }
        try {
            await primusProofTest(templateId);
        } catch (e) {
            console.error(e);
        } finally {
            setIsDoingAttestation(false);
            setCanAttestation(true);
        }
    };

    return (
        <div className="container">
            <div>
                <Title level={3} className="main-title">
                    Primus Demo
                </Title>
            </div>
            <div>
                <div className="card">
                    <div style={{display: "flex", width: "400px", gap: "10px"}}>
                        <span style={{alignContent: "center"}}>Template: </span>
                        <Select
                            showSearch
                            className="search-line"
                            placeholder="Search to Select"
                            optionFilterProp="label"
                            // filterSort={(optionA, optionB) =>
                            //   (optionA?.label ?? "")
                            //     .toLowerCase()
                            //     .localeCompare((optionB?.label ?? "").toLowerCase())
                            // }
                            onSelect={(value) => {
                                console.log(`Selected template: ${value}`);
                                setTemplateId(value);
                                setCanAttestation(true);
                            }}
                            options={templateStates.map((template) => ({
                                label: `${template.name} - ${template.source}`,
                                value: template.templateId,
                            }))}
                        />
                    </div>
                    <Button
                        type="primary"
                        onClick={startAttestation}
                        className="start-button"
                    >
                        Start Attestation
                    </Button>


                </div>
            </div>
        </div>
    );
}

export default App;
