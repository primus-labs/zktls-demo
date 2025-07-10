# A Quick Demo for Primus zkTLS 

This demo shows how to create zkTLS data attestations (proofs) about your 30-day PNL rate in Binance. I use the conditional compare in the proof generation, check [here] (https://docs.primuslabs.xyz/data-verification/zk-tls-sdk/test#verification-logics) for the syntax.


# How to Run the Demo?
git clone the repo into your local folder, then:

```node
cd proof-of-cex

npm run dev
```
and copy the local server URL in your browser and play. 

Remember to install the Primus [extension](https://chromewebstore.google.com/detail/primus/oeiomhmbaapihbilkfkhmlajkeegnjhe) before the test.

# Installation

We use vite and React as the frameworks to create a dapp project. 
```node
npm create vite@latest YOUR_PROJECT
```
You can choose **JavaScript** and **React** as framework options in the question list. In your project folder, install the realted modules.

```node
cd YOUR_PROJECT

npm install
```
Open your terminal and navigate to your project directory. Then run one of the following commands:

Using npm:
```node
npm install --save @primuslabs/zktls-js-sdk
```

Using yarn:
```node
yarn add --save @primuslabs/zktls-js-sdk
```

# Importing the SDK
After installation, you can import the SDK in your JavaScript or TypeScript files. Here's how:
```node
import PrimusZKTLS from "@primuslabs/zktls-js-sdk"
```

# Generate the Attestation
for init the SDK and get the zkTLS attestation, you can refer to this [example](https://docs.primuslabs.xyz/data-verification/zk-tls-sdk/test)

# More Templates
You can get more templates from the dev hub [marketplace](https://dev.primuslabs.xyz/marketplace)
