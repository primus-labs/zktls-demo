import { useState } from 'react'
import './App.css'
import { primusProofTest } from './testprimus'

function App() {
  const [appId, setAppId] = useState("")
  const [appSecret, setAppSecret] = useState("")
  const [attTemplateID, setAttTemplateID] = useState("2e3160ae-8b1e-45e3-8c59-426366278b9d")
  const [isLoading, setIsLoading] = useState(false)

  const handleStartAttestation = async () => {
    if (!appId || !appSecret || !attTemplateID) {
      alert('Please fill in all required fields')
      return
    }
    setIsLoading(true)
    try {
      const attestation = await primusProofTest(appId, appSecret, attTemplateID)
      console.log('Attestation:', attestation)
    } catch (error) {
      console.error('Attestation error:', error)
      if (error?.code) {
        alert(`${error?.code}: ${error?.message}`)

      } else {alert('Attestation process failed, please check the console')}
      
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
