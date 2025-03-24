import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  PORT: z.string().default('3001'),
  APP_ID: z.string().min(1, 'APP_ID is required'),
  APP_SECRET: z.string().min(1, 'APP_SECRET is required'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
})

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }
  
  return parsed.data
}

export const CONFIG = parseEnv()