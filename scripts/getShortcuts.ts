// Helper script to get the shortcuts
/* eslint-disable no-console */
import yargs from 'yargs'
import { getShortcuts } from '../src/runtime/getShortcuts'

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 --apps app1[,app2]')
  .options({
    apps: {
      alias: 'p',
      describe: 'App IDs to get shortcuts for, defaults to all',
      type: 'array',
      default: [],
      // Allows comma separated values
      coerce: (array: string[]) => {
        return array.flatMap((v) => v.split(','))
      },
    },
  })
  .parseSync()

void (async () => {
  const shortcuts = await getShortcuts(argv.apps)
  console.log('shortcuts', JSON.stringify(shortcuts, null, ' '))

  console.table(shortcuts)
})()
