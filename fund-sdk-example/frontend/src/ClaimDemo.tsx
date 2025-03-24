import { useState } from 'react'
import { PrimusFund } from "@primuslabs/fund-js-sdk"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { CONFIG } from './config'

export function ClaimDemo() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [txHash, setTxHash] = useState<string>("")

  async function handleClaim() {
    setLoading(true)
    setError("")
    setTxHash("")

    try {
      const primusFund = new PrimusFund()
      const provider = (window as any).ethereum
      await primusFund.init(provider, CONFIG.SUPPORTED_CHAIN_ID, CONFIG.APP_ID)

      // Backend signing function
      const signFn = async (signParams: any) => {
        const response = await fetch(`${CONFIG.BACKEND_URL}/sign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signParams),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message)
        return data.signature
      }

      // Generate attestation
      const attestation = await primusFund.attest("x", address!, signFn)

      // Claim tokens
      const receipt = {
        socialPlatform: "x",
        userIdentifier: "testUser",
        attestation
      }
      const claimTxReceipt = await primusFund.claim(receipt)
      setTxHash(claimTxReceipt.hash)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Claim Demo - Extension</h2>
      {isConnected ? (
        <>
          <div>Connected to {address}</div>
          <button onClick={() => disconnect()}>Disconnect</button>
          <button onClick={handleClaim} disabled={loading}>
            {loading ? 'Processing...' : 'Claim Tokens'}
          </button>
        </>
      ) : (
        <button onClick={() => connect({ connector: injected() })}>Connect Wallet</button>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}
      {txHash && (
        <div>
          Transaction successful! Hash: {txHash}
        </div>
      )}
    </div>
  )
}