import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import i18nextMiddleware from 'i18next-http-middleware'

// Instance used for testing
// Similar to the one used in the app
const testI18next = i18next.createInstance()

testI18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    // Sync init, so t can be used immediately
    initImmediate: false,
    backend: {
      // eslint-disable-next-line no-path-concat
      loadPath: `${__dirname}/../locales/{{lng}}.json`,
    },
    debug: true,
    fallbackLng: 'base',
    preload: ['base'],
  })

export const t = testI18next.t.bind(testI18next)
