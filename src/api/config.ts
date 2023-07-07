import { z } from 'zod'
import * as dotenv from 'dotenv'

export function getConfig() {
  dotenv.config()

  const productionSchema = z.object({
    GOOGLE_CLOUD_PROJECT: z.string().min(1),
  })

  const developmentSchema = z.object({
    GOOGLE_CLOUD_PROJECT: z.string().default('dev-project'),
  })

  return process.env.NODE_ENV === 'production'
    ? productionSchema.parse(process.env)
    : developmentSchema.parse(process.env)
}
