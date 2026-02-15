# Twitter API Proxy with PrimusPageCoreTLS

This project demonstrates how to use the PrimusPageCoreTLS SDK to make attested requests to the Twitter/X API through a local proxy server to avoid CORS issues.

## Setup

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Running the Example

### 1. Start the Proxy Server

First, start the proxy server in one terminal:

```bash
npm run proxy
```

This will launch a local proxy server on port 3001 that will forward requests to the Twitter API.

### 2. Run the Twitter API Test

In a second terminal, run:

```bash
npm start twitter
```

This will execute the Twitter proof test which will:
1. Initialize the PrimusPageCoreTLS SDK
2. Send a request to the Twitter API through the proxy
3. Verify the attestation
4. Log the results

### Alternative Example: OKX API

You can also run the OKX API example:

```bash
npm start primus
```

## Files

- `src/twitterProofTest.js` - Implementation of the Twitter API attestation
- `src/testprimus.js` - Implementation of the OKX API attestation
- `src/proxy.js` - Express server that acts as a proxy to handle CORS issues
- `src/index.js` - Entry point with CLI interface

## Troubleshooting

If you encounter errors:

1. Make sure the proxy server is running
2. Check that your Twitter credentials/tokens are valid
3. Verify network connectivity to the Twitter API

## Notes on CORS

The Twitter API has CORS restrictions that prevent direct browser requests. This implementation uses a local proxy server to overcome these restrictions.

```bash
npm install
npm run dev
```
