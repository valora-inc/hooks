// Helper script to call the plugins and get the positions
/* eslint-disable no-console */
import yargs from 'yargs'
import { Token } from '../src/plugin'
import { getPositions } from '../src/getPositions'

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 --address <address>')
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
  })
  .parseSync()

function breakdownToken(token: Token): string {
  if (token.type === 'base-token') {
    const priceUsd = Number(token.priceUsd)
    const balance = Number(token.balance) / 10 ** token.decimals
    const balanceUsd = Number(balance) * priceUsd
    return `${balance.toFixed(2)} ${token.symbol} ($${balanceUsd.toFixed(
      2,
    )}) @ $${priceUsd?.toFixed(2)}`
  } else {
    // app-token
    return token.tokens.map(breakdownToken).join(', ')
  }
}

void (async () => {
  const positions = await getPositions(argv.network, argv.address)
  console.log('positions', JSON.stringify(positions, null, ' '))

  console.table(
    positions.map((position) => {
      if (position.type === 'app-token') {
        const balanceDecimal =
          Number(position.balance) / 10 ** position.decimals
        return {
          type: position.type,
          address: position.address,
          label: position.label,
          priceUsd: Number(position.priceUsd).toFixed(2),
          balance: balanceDecimal.toFixed(2),
          balanceUsd: (balanceDecimal * position.priceUsd).toFixed(2),
          breakdown: position.tokens.map(breakdownToken).join(', '),
        }
      } else {
        return {
          type: position.type,
          address: position.address,
          label: position.label,
          balanceUsd: Number(position.balanceUsd).toFixed(2),
          breakdown: position.tokens.map(breakdownToken).join(', '),
        }
      }
    }),
  )
})()
