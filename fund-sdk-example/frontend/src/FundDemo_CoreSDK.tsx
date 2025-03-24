import { useState } from 'react'
import { PrimusPageCoreTLS } from "@primuslabs/zktls-page-core-sdk"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { CONFIG } from './config'
import { useWriteContract, useWalletClient } from 'wagmi'

export function FundCoreDemo() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [result, setResult] = useState<string>("")
  const { data: walletClient } = useWalletClient()
  const { writeContractAsync } = useWriteContract()

  async function handleFund() {
    setLoading(true)
    setError("")
    setResult("")

    try {
      // Initialize parameters
      const appId = CONFIG.APP_ID
      
      // Create a new instance of PrimusPageCoreTLS
      const zkTLS = new PrimusPageCoreTLS()
      
      // Initialize the SDK with appId (no need for appSecret on frontend)
      const initResult = await zkTLS.init(appId)
      console.log("PrimusCoreTLS initResult=", initResult)
      
      // Since we don't have the extension, we need to implement the fund function ourselves
      // This is a simplified example
      
      // First, create an attestation
      const request = {
        url: "https://api.x.com/user/profile", // This would be the API for verifying social identity
        method: "GET",
        header: {},
        body: ""
      }
      
      const responseResolves = [
        {
          keyName: 'username',
          parsePath: '$.data.username',
        }
      ]
      
      const generateRequest = zkTLS.generateRequestParams(request, responseResolves)
      generateRequest.setAttMode({
        algorithmType: "proxytls"
      })
      
      const generateRequestStr = generateRequest.toJsonString()
      
      // Get signed response from backend
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
      const attestation = await zkTLS.startAttestation(signedRequestStr)
      console.log("attestation=", attestation)
      
      // Verify the attestation
      const verifyResult = zkTLS.verifyAttestation(attestation)
      console.log("verifyResult=", verifyResult)
      
      if (verifyResult) {
        // In a real implementation, we would call the fund contract here
        // For demonstration, we'll just show the attestation
        setResult(JSON.stringify(attestation, null, 2))
      } else {
        throw new Error("Attestation verification failed")
      }
      
    } catch (err) {
      console.error("Error in fund operation:", err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Fund Demo - Core SDK</h2>
      <p>This demo uses zktls-page-core-sdk (no extension required)</p>
      
      {isConnected ? (
        <>
          <div>Connected to {address}</div>
          <button onClick={() => disconnect()}>Disconnect</button>
          <button onClick={handleFund} disabled={loading}>
            {loading ? 'Processing...' : 'Fund with zkTLS Core'}
          </button>
        </>
      ) : (
        <button onClick={() => connect({ connector: injected() })}>Connect Wallet</button>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}
      
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