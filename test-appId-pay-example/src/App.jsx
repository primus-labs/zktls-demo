import { useState } from 'react'
import './App.css'
import { primusProofTest } from './testprimus'

function App() {
  const [appId, setAppId] = useState("0x17ae11d76b72792478d7b7bcdc76da9574ab3cf8")
  const [appSecret, setAppSecret] = useState("0xafa01caf44f07d2b21bc5e2bde1de2a8ba56f33ac2e223169f99634f57d049b5")
  const [attTemplateID, setAttTemplateID] = useState("2dbbc11e-afc2-4a3e-a120-9eb2a456e027")
  const [isLoading, setIsLoading] = useState(false)

  const handleStartAttestation = async () => {
    if (!appId || !appSecret || !attTemplateID) {
      alert('Please fill in all required fields')
      return
    }
    setIsLoading(true)
    try {
      await primusProofTest(appId, appSecret, attTemplateID)
    } catch (error) {
      console.error('Attestation error:', error)
      alert('Attestation process failed, please check the console')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-container">
      <h1 className="app-title">Primus Attestation Demo</h1>
      <div className="card">
        <form className="form-container" onSubmit={(e) => { e.preventDefault(); handleStartAttestation(); }}>
          <div className="form-group">
            <label htmlFor="appId" className="form-label">
              App ID
            </label>
            <input
              id="appId"
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="Enter App ID"
              className="form-input"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="appSecret" className="form-label">
              App Secret
            </label>
            <input
              id="appSecret"
              type="text"
              value={appSecret}
              onChange={(e) => setAppSecret(e.target.value)}
              placeholder="Enter App Secret"
              className="form-input"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="attTemplateID" className="form-label">
              Attestation Template ID
            </label>
            <input
              id="attTemplateID"
              type="text"
              value={attTemplateID}
              onChange={(e) => setAttTemplateID(e.target.value)}
              placeholder="Enter Attestation Template ID"
              className="form-input"
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit"
            className="submit-button"
            disabled={isLoading || !appId || !appSecret || !attTemplateID}
          >
            {isLoading ? 'Processing...' : 'Start Attestation'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
