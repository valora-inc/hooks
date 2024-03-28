import { z } from 'zod'
import * as dotenv from 'dotenv'

export function getConfig() {
  dotenv.config()

  const sharedSchema = z.object({
    GET_TOKENS_INFO_URL: z.string(),
  })

  const productionSchema = z.intersection(
    sharedSchema,
    z.object({
      GOOGLE_CLOUD_PROJECT: z.string().min(1),
      POSITION_IDS: z.string().transform((val) => val.split(',')),
      SHORTCUT_IDS: z.string().transform((val) => val.split(',')),
    }),
  )

  const developmentSchema = z.intersection(
    sharedSchema,
    z.object({
      GOOGLE_CLOUD_PROJECT: z.string().default('dev-project'),
      POSITION_IDS: z
        .string()
        .default('')
        .transform((val) => (val === '' ? [] : val.split(','))),
      SHORTCUT_IDS: z
        .string()
        .default('')
        .transform((val) => (val === '' ? [] : val.split(','))),
    }),
  )

  return process.env.NODE_ENV === 'production'
    ? productionSchema.parse(process.env)
    : developmentSchema.parse(process.env)
}
