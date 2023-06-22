// Helper script to trigger a shortcut
/* eslint-disable no-console */
import yargs from 'yargs'
import { getShortcuts } from '../src/getShortcuts'

const argv = yargs(process.argv.slice(2))
  .usage(
    'Usage: $0 --network <network> --address <address> --app <appId> --shortcut <shortcutId> --positionAddress <positionAddress>',
  )
  .options({
    network: {
      alias: 'n',
      describe: 'Network to get positions for',
      choices: ['celo', 'celoAlfajores'],
      default: 'celo',
    },
    address: {
      alias: 'a',
      describe: 'Address to get positions for',
      type: 'string',
      demandOption: true,
    },
    app: {
      alias: 'p',
      describe: 'App ID of the shortcut to trigger',
      type: 'string',
      demandOption: true,
    },
    shortcut: {
      alias: 's',
      describe: 'Shortcut ID to trigger',
      type: 'string',
      demandOption: true,
    },
    positionAddress: {
      describe: 'Position address to trigger the shortcut on',
      type: 'string',
      demandOption: true,
    },
  })
  .parseSync()

void (async () => {
  const shortcuts = await getShortcuts([argv.app])

  const shortcut = shortcuts.find((s) => s.id === argv.shortcut)
  if (!shortcut) {
    throw new Error(
      `No shortcut found with id '${
        argv.shortcut
      }', available shortcuts: ${shortcuts.map((s) => s.id).join(', ')}`,
    )
  }

  console.log(
    `Triggering shortcut '${shortcut.id}' for app '${shortcut.appId}'`,
    {
      network: argv.network,
      address: argv.address,
      positionAddress: argv.positionAddress,
    },
  )
  const result = await shortcut.onTrigger(
    argv.network,
    argv.address,
    argv.positionAddress,
  )

  console.table(result)
})()
