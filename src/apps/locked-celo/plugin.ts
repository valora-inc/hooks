import { AppPlugin, ContractPositionDefinition } from '../../plugin'
import {
  Address,
  ContractFunctionExecutionError,
  createPublicClient,
  http,
} from 'viem'
import { celo } from 'viem/chains'
import { LockedGoldAbi } from './abis/locked-gold'
import { toBigDecimal, toDecimalNumber } from '../../numbers'

const CELO_ADDRESS = '0x471ece3750da237f93b8e339c536989b8978a438'
const LOCKED_GOLD_ADDRESS = '0x6cc083aed9e3ebe302a6336dbc7c921c9f03349e'
const CELO_DECIMALS = 18

interface PendingWithdrawal {
  time: bigint
  value: bigint
}

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

function zip<A, B>(as: readonly A[], bs: readonly B[]) {
  const len = Math.min(as.length, bs.length)
  const res: [A, B][] = []

  for (let i = 0; i < len; i++) {
    res.push([as[i], bs[i]])
  }
  return res
}

const plugin: AppPlugin = {
  getInfo() {
    return {
      id: 'locked-celo',
      name: 'Locked CELO',
      description: '',
    }
  },
  async getPositionDefinitions(network, address) {
    const lockedGoldContract = {
      address: LOCKED_GOLD_ADDRESS,
      abi: LockedGoldAbi,
    } as const

    const [totalLockedCelo, pendingWithdrawalsRaw] = await client
      .multicall({
        contracts: [
          {
            ...lockedGoldContract,
            functionName: 'getAccountTotalLockedGold',
            args: [address as Address],
          },
          {
            ...lockedGoldContract,
            functionName: 'getPendingWithdrawals',
            args: [address as Address],
          },
        ],
        allowFailure: false,
      })
      .catch((e) => {
        // getPendingWithdrawals reverts if the address hasn't locked anything
        // so we just return an empty array
        if (e instanceof ContractFunctionExecutionError) {
          return [0n, [[], []]] as const
        }
        throw e
      })

    const pendingWithdrawals = zip(
      pendingWithdrawalsRaw[1],
      pendingWithdrawalsRaw[0],
    ).map(([time, value]): PendingWithdrawal => ({ time, value }))

    let totalCeloUnlocking = 0n
    let totalCeloWithdrawable = 0n

    const currentTime = Date.now() / 1000
    for (let i = 0; i < pendingWithdrawals.length; i++) {
      const currentWithdrawal = pendingWithdrawals[i]

      if (currentWithdrawal.time < currentTime) {
        totalCeloWithdrawable = totalCeloWithdrawable + currentWithdrawal.value
      } else {
        totalCeloUnlocking = totalCeloUnlocking + currentWithdrawal.value
      }
    }

    const position: ContractPositionDefinition = {
      type: 'contract-position-definition',
      network,
      address: LOCKED_GOLD_ADDRESS,
      tokens: [{ address: CELO_ADDRESS, network }],
      label: 'Locked CELO',
      balances: async () => {
        return [
          toDecimalNumber(
            toBigDecimal(
              totalLockedCelo + totalCeloUnlocking + totalCeloWithdrawable,
              CELO_DECIMALS,
            ),
          ),
        ]
      },
    }

    return [position]
  },
  getAppTokenDefinition() {
    // We don't need this for now, since there are no intermediary tokens
    throw new Error('Not implemented')
  },
}

export default plugin
