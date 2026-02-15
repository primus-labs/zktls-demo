import { useState } from 'react'
import './App.css'
import { runAttestation } from './testPrimusAuth'
// import { twitterProofTest } from './twitterProofTest'

function App() {
  const [curlCommand, setCurlCommand] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCurlAttestation = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      // Run attestation with raw curl command
      const attestationResult = await runAttestation(curlCommand)
      if (!attestationResult.success) {
        throw new Error(attestationResult.error)
      }

      setResult(attestationResult.data)
    } catch (err) {
      console.error('Attestation error:', err)
      setError(err.message || 'An error occurred during attestation')
    } finally {
      setLoading(false)
    }
  }

  // const handleDirectAttestation = async () => {
  //   try {
  //     setLoading(true)
  //     setError(null)
  //     setResult(null)

  //     // Run direct attestation
  //     const attestationResult = await twitterProofTest()
  //     if (!attestationResult.success) {
  //       throw new Error(attestationResult.error)
  //     }

  //     setResult(attestationResult.data)
  //   } catch (err) {
  //     console.error('Attestation error:', err)
  //     setError(err.message || 'An error occurred during attestation')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  return (
    <div className="container">
      <h1>Primus Attestation Demo</h1>
      
      <div className="input-section">
        <label htmlFor="curlInput">Copy any website's network tab curl command and paste it below to attest the request:</label>
        <textarea
          id="curlInput"
          value={curlCommand}
          onChange={(e) => setCurlCommand(e.target.value)}
          placeholder="curl 'https://api.x.com/1.1/account/settings.json ...'"
          rows={10}
        />
      </div>

      <div className="button-section">
        <button 
          onClick={handleCurlAttestation}
          disabled={!curlCommand || loading}
          className="primary-button"
        >
          {loading ? 'Running Curl Attestation...' : 'Attest above pasted curl command'}
        </button>
        {/* <button 
          onClick={handleDirectAttestation}
          disabled={loading}
          className="secondary-button"
        >
          {loading ? 'Running Direct Attestation...' : 'Attest hardcoded request'}
        </button> */}
      </div>

      {error && (
        <div className="error-section">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="result-section">
          <h3>Result</h3>
          {typeof result === 'object' && result.message ? (
            <p>{result.message}</p>
          ) : (
            <pre>{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  )
}

export default App
