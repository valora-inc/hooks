import { z } from 'zod'
import * as dotenv from 'dotenv'

export function getConfig() {
  dotenv.config()

  return z
    .object({
      GOOGLE_CLOUD_PROJECT: z.string().min(1),
    })
    .parse(process.env)
}
