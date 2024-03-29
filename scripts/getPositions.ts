// Helper script to call the hooks and get the positions
/* eslint-disable no-console */
import yargs from 'yargs'
import BigNumber from 'bignumber.js'
import { Token } from '../src/types/positions'
import { getPositions } from '../src/runtime/getPositions'
import { NetworkId } from '../src/types/networkId'

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 --address <address>')
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
      demandOption: true,
    },
    apps: {
      alias: 'p',
      describe: 'App IDs to get positions for, defaults to all',
      type: 'array',
      default: [],
      // Allows comma separated values
      coerce: (array: string[]) => {
        return array.flatMap((v) => v.split(','))
      },
    },
    getTokensInfoUrl: {
      alias: 'g',
      describe: 'URL to get token info from',
      type: 'string',
      default: 'https://api.mainnet.valora.xyz/getTokensInfo',
    },
  })
  .parseSync()

function breakdownToken(token: Token): string {
  if (token.type === 'base-token') {
    const priceUsd = new BigNumber(token.priceUsd)
    const balance = new BigNumber(token.balance)
    const balanceUsd = balance.times(priceUsd)
    return `${balance.toFixed(2)} ${token.symbol} ($${balanceUsd.toFixed(
      2,
    )}) @ $${priceUsd?.toFixed(2)}`
  } else {
    // app-token
    return token.tokens.map(breakdownToken).join(', ')
  }
}

void (async () => {
  const positions = await getPositions(
    argv.networkId,
    argv.address,
    argv.apps,
    argv.getTokensInfoUrl,
  )
  console.log('positions', JSON.stringify(positions, null, ' '))

  console.table(
    positions.map((position) => {
      if (position.type === 'app-token') {
        const balance = new BigNumber(position.balance)
        return {
          appId: position.appId,
          type: position.type,
          address: position.address,
          network: position.networkId,
          title: `${position.displayProps.title} (${position.displayProps.description})`,
          priceUsd: new BigNumber(position.priceUsd).toFixed(2),
          balance: balance.toFixed(2),
          balanceUsd: balance.times(position.priceUsd).toFixed(2),
          breakdown: position.tokens.map(breakdownToken).join(', '),
          availableShortcutIds: position.availableShortcutIds,
        }
      } else {
        return {
          appId: position.appId,
          type: position.type,
          address: position.address,
          network: position.networkId,
          title: `${position.displayProps.title} (${position.displayProps.description})`,
          balanceUsd: new BigNumber(position.balanceUsd).toFixed(2),
          breakdown: position.tokens.map(breakdownToken).join(', '),
          availableShortcutIds: position.availableShortcutIds,
        }
      }
    }),
  )
})()
