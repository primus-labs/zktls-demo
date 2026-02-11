# Primus Fund SDK Example

This project demonstrates how to use the Primus Fund SDK to send and claim tokens via social accounts. It provides two implementation approaches:

1. **Extension-based implementation**: Using the Primus Extension and `@primuslabs/fund-js-sdk`
2. **Core SDK implementation**: Using the `@primuslabs/zktls-page-core-sdk` (no extension required)

## Project Structure

- `frontend`: React application with Wagmi integration for connecting wallets
- `backend`: Express server for signing attestations
- Components:
  - `FundDemo_Extension.tsx`: Fund functionality using the Primus Extension
  - `ClaimDemo.tsx`: Claim functionality using the Primus Extension
  - `FundDemo_CoreSDK.tsx`: Fund functionality using the zktls-page-core-sdk
  - `ClaimDemo_CoreSDK.tsx`: Claim functionality using the zktls-page-core-sdk

## Prerequisites

- Node.js v18 or later
- An AppID and AppSecret from [Primus Developer Hub](https://dev.primuslabs.xyz/)
- MetaMask or another Web3 wallet
- For extension-based demos: [Primus Extension](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe)

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Copy the example environment file and edit it with your values:
   ```
   cp .env.example .env
   ```

3. Install dependencies and start the development server:
   ```
   npm install
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Copy the example environment file and edit it with your values:
   ```
   cp .env.example .env
   ```

3. Install dependencies and start the server:
   ```
   npm install
   npm start
   ```

## Usage

1. Connect your MetaMask wallet to **Monad Testnet** (Chain ID: 10143)
   - Add Monad Testnet to MetaMask:
     - Network Name: Monad Testnet
     - RPC URL: https://monad-testnet-rpc.publicnode.com
     - Chain ID: 10143
     - Currency Symbol: MONAD

2. The demo interface is divided into a 2x2 grid:
   - **Top-left**: Fund Demo (Extension) - Requires Primus Extension
   - **Top-right**: Claim Demo (Extension) - Requires Primus Extension
   - **Bottom-left**: Fund Demo (Core SDK) - No extension required
   - **Bottom-right**: Claim Demo (Core SDK) - No extension required

3. Each section allows you to:
   - Connect your wallet
   - Fund tokens to social accounts or claim tokens with social verification
   - See the results of operations

## Features

- Two implementation approaches:
  - Extension-based (requires Primus Extension)
  - Core SDK (no extension required)
- Fund tokens to social accounts
- Claim tokens with social account verification
- Wallet integration with Wagmi
- Backend signing implementation
- Responsive grid layout

## Implementation Details

### Extension-Based Implementation
- Uses `@primuslabs/fund-js-sdk`
- Requires the Primus Extension to be installed
- Handles token approval and transactions through the extension

### Core SDK Implementation
- Uses `@primuslabs/zktls-page-core-sdk`
- Does not require the extension
- Performs zkTLS attestations directly
- Demonstrates the core functionality without blockchain transactions

## Notes

- Make sure to have test tokens in your wallet for funding with the extension-based approach
- For the extension-based demos, the Primus Extension must be installed
- For the core SDK demos, no extension is required
- **Important**: Only Monad Testnet (Chain ID 10143) is currently supported by the Fund SDK 