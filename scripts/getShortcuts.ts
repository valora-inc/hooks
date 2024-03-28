// Helper script to get the shortcuts
/* eslint-disable no-console */
import yargs from 'yargs'
import { getShortcuts } from '../src/runtime/getShortcuts'
import { NetworkId } from '../src/api/networkId'

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 --apps app1[,app2]')
  .options({
    networkId: {
      alias: 'n',
      describe: 'Network ID to get positions for',
      choices: Object.values(NetworkId),
      default: NetworkId['celo-mainnet'],
    },
    address: {
      alias: 'a',
      describe: 'Address to get positions for',
      type: 'string',
    },
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
  const shortcuts = await getShortcuts(argv.networkId, argv.address, argv.apps)
  console.log('shortcuts', JSON.stringify(shortcuts, null, ' '))

  console.table(shortcuts)
})()
