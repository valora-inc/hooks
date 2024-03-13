import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import got from 'got'
import {
  AppTokenPositionDefinition,
  PositionsHook,
  TokenDefinition,
} from '../../types/positions'
import { curveTripoolAbi } from './abis/curve-tripool'
import { curvePoolAbi } from './abis/curve-pool'
import { DecimalNumber, toDecimalNumber } from '../../types/numbers'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

interface CurveApiResponse {
  success: boolean
  data: {
    // this has more fields, but only including fields we use
    poolData: {
      address: Address
      implementation: string
    }[]
  }
}

type PoolSize = 2 | 3

const CURVE_BLOCKCHAIN_IDS: Record<string, string> = {
  celo: 'celo',
}

async function getAllCurvePools(
  network: string,
): Promise<{ address: Address; size: PoolSize }[]> {
  const blockchainId = CURVE_BLOCKCHAIN_IDS[network]
  if (!blockchainId) {
    return []
  }
  const { data } = await got
    .get(`https://api.curve.fi/v1/getPools/${blockchainId}/factory`)
    .json<CurveApiResponse>()

  return data.poolData.map((poolInfo) => ({
    address: poolInfo.address,
    size: poolInfo.implementation === 'plain3basic' ? 3 : 2,
  }))
}

export async function getPoolPositionDefinitions(
  network: string,
  address: Address,
) {
  const pools = await getAllCurvePools(network)

  // call balanceOf to check if user has balance on a pool
  const result = await client.multicall({
    contracts: pools.map(
      (pool) =>
        ({
          address: pool.address,
          abi: pool.size === 3 ? curveTripoolAbi : curvePoolAbi,
          functionName: 'balanceOf',
          args: [address],
        }) as const,
    ),
    allowFailure: false,
  })

  const userPools = pools
    .map((pool, i) => ({ ...pool, balance: result[i] }))
    .filter((pool) => pool.balance > 0)

  return await Promise.all(
    userPools.map((pool) =>
      getPoolPositionDefinition(network, pool.address, pool.size),
    ),
  )
}

async function getPoolPositionDefinition(
  network: string,
  poolAddress: Address,
  poolSize: PoolSize,
) {
  const poolTokenContract = {
    address: poolAddress,
    abi: poolSize === 3 ? curveTripoolAbi : curvePoolAbi,
  }

  const tokenAddresses = (await client.multicall({
    contracts: Array.from({ length: poolSize }, (_, index) =>
      BigInt(index),
    ).map((n) => ({
      ...poolTokenContract,
      functionName: 'coins',
      args: [n],
    })),
    allowFailure: false,
  })) as Address[]

  const position: AppTokenPositionDefinition = {
    type: 'app-token-definition',
    network,
    address: poolAddress.toLowerCase(),
    tokens: tokenAddresses.map((token) => ({
      address: token.toLowerCase(),
      network,
    })),
    displayProps: ({ resolvedTokens }) => {
      const tokenSymbols = tokenAddresses.map(
        (tokenAddress) => resolvedTokens[tokenAddress.toLowerCase()].symbol,
      )
      return {
        title: tokenSymbols.join(' / '),
        description: 'Pool',
        imageUrl:
          'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/curve.png',
      }
    },
    pricePerShare: async ({ tokensByAddress }) => {
      const [balances, totalSupply] = await client.multicall({
        contracts: [
          { ...poolTokenContract, functionName: 'get_balances' },
          { ...poolTokenContract, functionName: 'totalSupply' },
        ],
        allowFailure: false,
      })
      const poolToken = tokensByAddress[poolAddress.toLowerCase()]
      const tokens = tokenAddresses.map(
        (tokenAddress) => tokensByAddress[tokenAddress.toLowerCase()],
      )
      const reserves = balances.map((balance, index) =>
        toDecimalNumber(balance, tokens[index].decimals),
      )
      const supply = toDecimalNumber(totalSupply, poolToken.decimals)
      const pricePerShare = reserves.map((r) => r.div(supply) as DecimalNumber)
      return pricePerShare
    },
  }

  return position
}

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'curve',
      name: 'Curve',
      description: 'Curve pools',
    }
  },
  getPositionDefinitions(network, address) {
    return getPoolPositionDefinitions(network, address as Address)
  },
  async getAppTokenDefinition({ network, address }: TokenDefinition) {
    // Assume that the address is a pool address
    const pools = await getAllCurvePools(network)
    const poolSize = pools.find((pool) => pool.address === address)?.size
    return await getPoolPositionDefinition(
      network,
      address as Address,
      poolSize!,
    )
  },
}

export default hook
