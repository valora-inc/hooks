import { createI18Next } from '../src/utils/i18next'

// Instance used for testing
const testI18next = createI18Next()

export const t = testI18next.t.bind(testI18next)
