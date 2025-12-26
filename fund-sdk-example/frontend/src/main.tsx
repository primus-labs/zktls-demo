import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider, createConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http } from 'viem'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'
import './index.css'
import App from './App.tsx'

// Create a client
const queryClient = new QueryClient()

// Define the Monad Testnet chain
const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MONAD',
  },
  rpcUrls: {
    default: { http: ['https://monad-testnet-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://monad-testnet.blockscout.com' },
  },
  testnet: true,
})

// Set up wagmi config
const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
