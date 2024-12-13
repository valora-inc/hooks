import {
  PositionsHook,
  ContractPositionDefinition,
} from '../../types/positions'
import {
  Address,
  ContractFunctionExecutionError,
  createPublicClient,
  http,
} from 'viem'
import { celo } from 'viem/chains'
import { LockedGoldAbi } from './abis/locked-gold'
import { toDecimalNumber } from '../../types/numbers'
import { NetworkId } from '../../types/networkId'

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

const hook: PositionsHook = {
  getInfo() {
    return {
      name: 'Locked CELO',
    }
  },
  async getPositionDefinitions({ networkId, address }) {
    if (networkId !== NetworkId['celo-mainnet'] || !address) {
      // dapp is only on Celo and hook implementation is hardcoded to Celo mainnet (contract addresses in particular)
      return []
    }
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

    const totalCelo =
      totalLockedCelo + totalCeloUnlocking + totalCeloWithdrawable
    if (totalCelo === 0n) {
      return []
    }

    const position: ContractPositionDefinition = {
      type: 'contract-position-definition',
      networkId,
      address: LOCKED_GOLD_ADDRESS,
      tokens: [{ address: CELO_ADDRESS, networkId }],
      displayProps: {
        title: 'Locked CELO',
        description: '', // TODO
        imageUrl:
          'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/CELO.png',
        manageUrl: undefined,
      },
      balances: async () => {
        return [toDecimalNumber(totalCelo, CELO_DECIMALS)]
      },
    }

    return [position]
  },
}

export default hook
