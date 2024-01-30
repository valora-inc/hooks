import { z } from 'zod'
import * as dotenv from 'dotenv'

export function getConfig() {
  dotenv.config()

  const productionSchema = z.object({
    GOOGLE_CLOUD_PROJECT: z.string().min(1),
    APP_IDS: z.string().transform((val) => val.split(',')),
  })

  const developmentSchema = z.object({
    GOOGLE_CLOUD_PROJECT: z.string().default('dev-project'),
    APP_IDS: z
      .string()
      .default('')
      .transform((val) => (val === '' ? [] : val.split(','))),
  })

  return process.env.NODE_ENV === 'production'
    ? productionSchema.parse(process.env)
    : developmentSchema.parse(process.env)
}
