// This is the demo for the Core SDK

import { useState } from 'react'
import { PrimusPageCoreTLS } from "@primuslabs/zktls-page-core-sdk"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { CONFIG } from './config'

export function PrimusCoreTLSDemo() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [result, setResult] = useState<string>("")
  const [verified, setVerified] = useState(false)

  async function handleProofTest() {
    setLoading(true)
    setError("")
    setResult("")
    setVerified(false)

    try {
      // Initialize parameters
      const appId = CONFIG.APP_ID
      
      // Create a new instance of PrimusPageCoreTLS
      const zkTLS = new PrimusPageCoreTLS()
      
      // Initialize the SDK with appId (no need for appSecret on frontend)
      const initResult = await zkTLS.init(appId)
      console.log("PrimusCoreTLS initResult=", initResult)
      
      // Example request for testing (using a public API)
      const request = {
        url: "https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=BTC-USD",
        method: "GET",
        header: {},
        body: ""
      }
      
      // Define what we want to extract from the response
      const responseResolves = [
        {
          keyName: 'instType',
          parsePath: '$.data[0].instType',
        }
      ]
      
      // Generate attestation request
      const generateRequest = zkTLS.generateRequestParams(request, responseResolves)
      
      // Set zkTLS mode to proxy model
      generateRequest.setAttMode({
        algorithmType: "proxytls"
      })
      
      // Convert to JSON string
      const generateRequestStr = generateRequest.toJsonString()
      
      // We need to get this signed by our backend
      const response = await fetch(`${CONFIG.BACKEND_URL}/sign-page-core`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: generateRequestStr }),
      })
      
      const responseData = await response.json()
      if (!response.ok) {
        throw new Error(responseData.message || 'Backend signing failed')
      }
      
      const signedRequestStr = responseData.signature
      
      // Start attestation process
      console.log("Starting attestation with signed request...");
      const attestation = await zkTLS.startAttestation(signedRequestStr)
      console.log("attestation=", attestation)
      setResult(JSON.stringify(attestation, null, 2))
      
      // Verify the attestation
      const verifyResult = zkTLS.verifyAttestation(attestation)
      console.log("verifyResult=", verifyResult)
      setVerified(verifyResult)
      
    } catch (err) {
      console.error("Error in proof test:", err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Primus Page Core TLS Demo</h2>
      <p>This demo uses the zktls-page-core-sdk (no extension required)</p>
      
      {isConnected ? (
        <>
          <div>Connected to {address}</div>
          <button onClick={() => disconnect()}>Disconnect</button>
          <button onClick={handleProofTest} disabled={loading}>
            {loading ? 'Processing...' : 'Run zkTLS Proof Test'}
          </button>
        </>
      ) : (
        <button onClick={() => connect({ connector: injected() })}>Connect Wallet</button>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {verified && (
        <div style={{ color: 'green', marginTop: '10px' }}>
          ✓ Attestation verified successfully!
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: '10px' }}>
          <h3>Attestation Result:</h3>
          <pre style={{ 
            maxHeight: '200px', 
            overflow: 'auto', 
            // backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px' 
          }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  )
} 