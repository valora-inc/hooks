import { createLogger } from '@valora/logging'

export const logger = createLogger({
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
  },
})
