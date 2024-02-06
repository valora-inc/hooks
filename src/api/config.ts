import { z } from 'zod'
import * as dotenv from 'dotenv'

export function getConfig() {
  dotenv.config()

  const productionSchema = z.object({
    GOOGLE_CLOUD_PROJECT: z.string().min(1),
    POSITION_IDS: z.string().transform((val) => val.split(',')),
    SHORTCUT_IDS: z.string().transform((val) => val.split(',')),
  })

  const developmentSchema = z.object({
    GOOGLE_CLOUD_PROJECT: z.string().default('dev-project'),
    POSITION_IDS: z
      .string()
      .default('')
      .transform((val) => (val === '' ? [] : val.split(','))),
    SHORTCUT_IDS: z
      .string()
      .default('')
      .transform((val) => (val === '' ? [] : val.split(','))),
  })

  return process.env.NODE_ENV === 'production'
    ? productionSchema.parse(process.env)
    : developmentSchema.parse(process.env)
}
