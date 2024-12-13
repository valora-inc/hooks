import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import i18nextMiddleware from 'i18next-http-middleware'
import path from 'path'

const DEFAULT_LANGUAGE = 'base'

export function createI18Next() {
  const i18nextInstance = i18next.createInstance()
  i18nextInstance
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
      // Sync init, so t can be used immediately
      initAsync: false,
      backend: {
        loadPath: path.join(__dirname, '../../locales/{{lng}}.json'),
      },
      fallbackLng: DEFAULT_LANGUAGE,
      preload: [DEFAULT_LANGUAGE],
      // Uncomment to troubleshoot i18next issues
      // debug: true,
    })
    .catch((error) => {
      throw new Error(`Failed to initialize i18next: ${error}`)
    })

  return i18nextInstance
}
