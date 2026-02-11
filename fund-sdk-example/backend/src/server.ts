import express from 'express'
import cors from 'cors'
import { PrimusZKTLS } from '@primuslabs/zktls-js-sdk'
import { PrimusPageCoreTLS } from '@primuslabs/zktls-page-core-sdk'
import { CONFIG } from './config'

const app = express()

app.use(cors({
  origin: CONFIG.CORS_ORIGIN,
  credentials: true,
}))
app.use(express.json())

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', appSecret: CONFIG.APP_SECRET ? 'configured' : 'missing' })
})

app.post('/sign', async (req, res) => {
  console.log('Received sign request with body:', JSON.stringify(req.body))
  
  try {
    const signParams = req.body
    console.log('Creating PrimusZKTLS instance...')
    
    const zkTLS = new PrimusZKTLS()
    console.log('PrimusZKTLS instance created')
    
    // Initialize with appId and appSecret
    console.log('Initializing with appSecret...')
    await zkTLS.init("", CONFIG.APP_SECRET)
    console.log('Initialization successful')
    
    // Convert signParams to string if needed
    const signParamsStr = typeof signParams === 'string' 
      ? signParams 
      : JSON.stringify(signParams)
    
    console.log('Signing with parameters...', signParamsStr.substring(0, 100) + '...')
    const signature = await zkTLS.sign(signParamsStr)
    console.log('Signing successful, signature length:', signature.length)
    
    res.json({ signature })
  } catch (error) {
    console.error('Error in /sign endpoint:', error)
    
    let errorMessage = 'An error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error stack:', error.stack)
    }
    
    res.status(500).json({ 
      message: errorMessage,
      timestamp: new Date().toISOString(),
      appSecretConfigured: !!CONFIG.APP_SECRET
    })
  }
})

// Endpoint for the PrimusPageCoreTLS demo
app.post('/sign-page-core', async (req, res) => {
  console.log('Received page core sign request with body:', JSON.stringify(req.body))
  
  try {
    const { request } = req.body
    
    if (!request) {
      return res.status(400).json({ message: 'Missing request parameter' })
    }
    
    console.log('Creating PrimusPageCoreTLS instance...')
    
    const zkTLS = new PrimusPageCoreTLS()
    console.log('PrimusPageCoreTLS instance created')
    
    // Initialize with appId and appSecret
    console.log('Initializing with appSecret...')
    await zkTLS.init(CONFIG.APP_ID, CONFIG.APP_SECRET)
    console.log('Initialization successful')
    
    console.log('Signing with request...')
    const signature = await zkTLS.sign(request)
    console.log('Signing successful, signature length:', signature.length)
    
    res.json({ signature })
  } catch (error) {
    console.error('Error in /sign-page-core endpoint:', error)
    
    let errorMessage = 'An error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error stack:', error.stack)
    }
    
    res.status(500).json({ 
      message: errorMessage,
      timestamp: new Date().toISOString(),
      appSecretConfigured: !!CONFIG.APP_SECRET
    })
  }
})

app.listen(CONFIG.PORT, () => {
  console.log(`Server running on port ${CONFIG.PORT}`)
  console.log(`CORS origin: ${CONFIG.CORS_ORIGIN}`)
  console.log(`APP_SECRET configured: ${!!CONFIG.APP_SECRET}`)
})