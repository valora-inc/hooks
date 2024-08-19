#!/usr/bin/env node

import fs from 'fs'
import i18next from 'i18next'
import path from 'path'

interface DappDirectory {
  categories: Category[]
  applications: Application[]
}

interface Category {
  id: string
  name: string
  backgroundColor: string
  fontColor: string
}

interface Application {
  name: string
  id: string
  categoryId: string
  description: string
  logoUrl: string
  url: string
}

const localizedFiles = fs.readdirSync('locales')
const resources = localizedFiles.reduce(
  (acc: { [lng: string]: any }, fileName: string) => {
    const lng = path.parse(fileName).name
    return {
      ...acc,
      [lng]: { translation: require(`../locales/${fileName}`) },
    }
  },
  {},
)

i18next
  .init({
    resources,
    load: 'all',
    fallbackLng: {
      default: ['en'],
    },
  })
  .catch((reason: any) =>
    console.error('Config', 'Failed to init i18n', reason),
  )

function t(key: string, lng: string) {
  return i18next.t(key, { lng })
}

async function generateTranslatedFiles() {
  const dAppDirectory: DappDirectory = JSON.parse(
    fs.readFileSync('src/valora-dapp-list.json', 'utf8'),
  )
  for (const fileName of localizedFiles) {
    const lng = path.parse(fileName).name
    const localizedDirectory = { ...dAppDirectory }
    localizedDirectory.categories = localizedDirectory.categories.map(
      (category) => ({
        ...category,
        name: t(category.name, lng),
      }),
    )
    localizedDirectory.applications = localizedDirectory.applications.map(
      (application) => ({
        ...application,
        name: t(application.name, lng),
        description: t(application.description, lng),
      }),
    )
    fs.writeFileSync(
      `translations/valora-dapp-list-${fileName}`,
      JSON.stringify(localizedDirectory, undefined, 2),
    )
  }
}

generateTranslatedFiles()
  .then(() => console.info('Finished'))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
