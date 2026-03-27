import { useState } from 'react'
import { PrimusFund } from "@primuslabs/fund-js-sdk"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { CONFIG } from './config'

export function FundDemo() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [txHash, setTxHash] = useState<string>("")
  const [debugInfo, setDebugInfo] = useState<string>("")

  async function initializePrimusFund() {
    try {
      console.log("Initializing PrimusFund...")
      const primusFund = new PrimusFund()
      console.log("PrimusFund instance created")
      
      const provider = (window as any).ethereum
      if (!provider) {
        throw new Error("Ethereum provider not found")
      }
      console.log("Provider found:", provider)
      
      console.log("Config values:", {
        chainId: CONFIG.SUPPORTED_CHAIN_ID,
        appId: CONFIG.APP_ID,
        tokenAddress: CONFIG.TEST_TOKEN_ADDRESS
      })
      
      console.log("Calling primusFund.init...")
      await primusFund.init(provider, CONFIG.SUPPORTED_CHAIN_ID, CONFIG.APP_ID)
      console.log("PrimusFund initialized successfully")
      
      console.log("Supported chain IDs:", primusFund.supportedChainIds)
      console.log("Supported social platforms:", primusFund.supportedSocialPlatforms)
      
      return primusFund
    } catch (error) {
      console.error("Error initializing PrimusFund:", error)
      throw error
    }
  }

  async function handleFund() {
    setLoading(true)
    setError("")
    setTxHash("")
    setDebugInfo("")

    try {
      console.log("Starting fund process...")
      const primusFund = await initializePrimusFund()

      // Example fund parameters
      const fundParam = {
        tokenInfo: {
          tokenType: 0, // ERC20
          tokenAddress: CONFIG.TEST_TOKEN_ADDRESS,
        },
        recipientInfos: [
          {
            socialPlatform: "x",
            userIdentifier: "testUser",
            tokenAmount: "0.1",
          }
        ],
      }
      
      console.log("Fund parameters:", JSON.stringify(fundParam, null, 2))
      console.log("Calling primusFund.fund...")
      
      const fundTxReceipt = await primusFund.fund(fundParam)
      console.log("Fund transaction receipt:", fundTxReceipt)
      
      setTxHash(fundTxReceipt.hash)
    } catch (err) {
      console.error("Fund error:", err)
      
      // Extract more detailed error information
      let errorMessage = 'An error occurred'
      let debugDetails = ''
      
      if (err instanceof Error) {
        errorMessage = err.message
        debugDetails = `Stack: ${err.stack || 'No stack trace'}`
      } else {
        debugDetails = `Unknown error type: ${typeof err}, Value: ${JSON.stringify(err)}`
      }
      
      setError(errorMessage)
      setDebugInfo(debugDetails)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Fund Demo - Extension</h2>
      {isConnected ? (
        <>
          <div>Connected to {address}</div>
          <button onClick={() => disconnect()}>Disconnect</button>
          <button onClick={handleFund} disabled={loading}>
            {loading ? 'Processing...' : 'Fund Tokens'}
          </button>
        </>
      ) : (
        <button onClick={() => connect({ connector: injected() })}>Connect Wallet</button>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}
      {debugInfo && (
        <div style={{ marginTop: '10px', color: 'orange', fontSize: '12px', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
          <strong>Debug Info:</strong>
          <pre>{debugInfo}</pre>
          <p>Check browser console for more details.</p>
        </div>
      )}
      {txHash && (
        <div>
          Transaction successful! Hash: {txHash}
        </div>
      )}
    </div>
  )
}