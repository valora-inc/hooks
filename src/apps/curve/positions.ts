import { Address, ContractFunctionParameters } from 'viem'
import got from 'got'
import {
  AppTokenPositionDefinition,
  PositionsHook,
  TokenDefinition,
} from '../../types/positions'
import { curveTripoolAbi } from './abis/curve-tripool'
import { curvePoolAbi } from './abis/curve-pool'
import { DecimalNumber, toDecimalNumber } from '../../types/numbers'
import { NetworkId } from '../../api/networkId'
import { getClient } from '../../runtime/client'
import { getTokenId } from '../../runtime/getTokenId'
import { isNative } from '../runtime/isNative'

interface CurveApiResponse {
  success: boolean
  data: {
    // this has more fields, but only including fields we use
    poolData: {
      address: Address
      implementation: string
      coins: Object[]
    }[]
  }
}

type PoolSize = 2 | 3

const NETWORK_ID_TO_CURVE_BLOCKCHAIN_ID: Record<NetworkId, string | null> = {
  [NetworkId['celo-mainnet']]: 'celo',
  [NetworkId['ethereum-mainnet']]: 'ethereum',
  [NetworkId['arbitrum-one']]: 'arbitrum',
  [NetworkId['op-mainnet']]: 'optimism',
  [NetworkId['ethereum-sepolia']]: null,
  [NetworkId['arbitrum-sepolia']]: null,
  [NetworkId['op-sepolia']]: null,
  [NetworkId['celo-alfajores']]: null,
}

export async function getAllCurvePools(
  networkId: NetworkId,
): Promise<{ address: Address; size: PoolSize }[]> {
  const blockchainId = NETWORK_ID_TO_CURVE_BLOCKCHAIN_ID[networkId]
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
  networkId: NetworkId,
  address: Address,
) {
  const pools = await getAllCurvePools(networkId)

  // call balanceOf to check if user has balance on a pool
  const client = getClient(networkId)
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
      getPoolPositionDefinition(networkId, pool.address, pool.size),
    ),
  )
}

async function getPoolPositionDefinition(
  networkId: NetworkId,
  poolAddress: Address,
  poolSize: PoolSize,
) {
  const poolTokenContract = {
    address: poolAddress,
    abi: poolSize === 3 ? curveTripoolAbi : curvePoolAbi,
  }
  const client = getClient(networkId)
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

  const balancesFunctionCallParams: ContractFunctionParameters[] = [
    // get_balances can be used for older pool versions like 0.3.1 (example: https://celoscan.io/address/0xAF7Ee5Ba02dC9879D24cb16597cd854e13f3aDa8#readContract )
    //   but not in new versions like 0.3.7 (example: https://etherscan.io/address/0x21e27a5e5513d6e65c4f830167390997aa84843a#code )
    {
      ...poolTokenContract,
      functionName: 'balances',
      args: [BigInt(0)],
    },
    {
      ...poolTokenContract,
      functionName: 'balances',
      args: [BigInt(1)],
    },
  ]
  if (poolSize === 3) {
    balancesFunctionCallParams.push({
      ...poolTokenContract,
      functionName: 'balances',
      args: [BigInt(2)],
    })
  }

  const position: AppTokenPositionDefinition = {
    type: 'app-token-definition',
    networkId,
    address: poolAddress.toLowerCase(),
    tokens: tokenAddresses.map((token) => ({
      address: token.toLowerCase(),
      networkId,
    })),
    displayProps: ({ resolvedTokensByTokenId }) => {
      const tokenSymbols = tokenAddresses.map(
        (tokenAddress) =>
          resolvedTokensByTokenId[
            getTokenId({
              networkId,
              address: tokenAddress,
              isNative: isNative({ networkId, address: tokenAddress }),
            })
          ].symbol,
      )
      return {
        title: tokenSymbols.join(' / '),
        description: 'Pool',
        imageUrl:
          'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/curve.png',
      }
    },
    pricePerShare: async ({ tokensByTokenId }) => {
      const [totalSupply, ...balances] = (await client.multicall({
        contracts: [
          { ...poolTokenContract, functionName: 'totalSupply' },
          ...balancesFunctionCallParams,
        ],
        allowFailure: false,
      })) as bigint[]
      const poolTokenId = getTokenId({
        address: poolAddress,
        isNative: false,
        networkId,
      })
      const poolToken = tokensByTokenId[poolTokenId]
      const tokens = tokenAddresses.map(
        (tokenAddress) =>
          tokensByTokenId[
            getTokenId({
              address: tokenAddress,
              networkId,
              isNative: isNative({ networkId, address: tokenAddress }),
            })
          ],
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
  getPositionDefinitions(networkId, address) {
    return getPoolPositionDefinitions(networkId, address as Address)
  },
  async getAppTokenDefinition({ networkId, address }: TokenDefinition) {
    // Assume that the address is a pool address
    const pools = await getAllCurvePools(networkId)
    const poolSize = pools.find((pool) => pool.address === address)?.size
    return await getPoolPositionDefinition(
      networkId,
      address as Address,
      poolSize!,
    )
  },
}

export default hook
