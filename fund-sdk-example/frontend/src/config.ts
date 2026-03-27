export const CONFIG = {
  APP_ID: import.meta.env.VITE_APP_ID || "",
  SUPPORTED_CHAIN_ID: 10143, // Monad Testnet - the only supported chain according to the SDK
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3001",
  TEST_TOKEN_ADDRESS: import.meta.env.VITE_TEST_TOKEN_ADDRESS || "",
}

// Type checking for required environment variables
const requiredEnvVars = [
  'VITE_APP_ID',
  'VITE_TEST_TOKEN_ADDRESS',
] as const

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    console.warn(`Missing environment variable: ${envVar}`)
  }
}