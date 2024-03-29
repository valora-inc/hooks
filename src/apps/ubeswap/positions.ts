import {
  AppTokenPosition,
  AppTokenPositionDefinition,
  ContractPositionDefinition,
  PositionDefinition,
  PositionsHook,
  TokenDefinition,
} from '../../types/positions'
import got from 'got'
import BigNumber from 'bignumber.js'
import { uniswapV2PairAbi } from './abis/uniswap-v2-pair'
import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { erc20Abi } from '../../abis/erc-20'
import { DecimalNumber, toDecimalNumber } from '../../types/numbers'
import { stakingRewardsAbi } from './abis/staking-rewards'
import farms from './data/farms.json'
import { NetworkId } from '../../api/networkId'
import { getTokenId } from '../../runtime/getTokenId'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

const PAIRS_QUERY = `
  query getPairs($address: ID!) {
    user(id: $address) {
      liquidityPositions {
        pair {
          id
        }
        liquidityTokenBalance
      }
    }
  }
`

async function getPoolPositionDefinition(
  networkId: NetworkId,
  poolAddress: Address,
): Promise<AppTokenPositionDefinition> {
  const poolTokenContract = {
    address: poolAddress,
    abi: uniswapV2PairAbi,
  } as const
  const [token0Address, token1Address] = await client.multicall({
    contracts: [
      {
        ...poolTokenContract,
        functionName: 'token0',
      },
      {
        ...poolTokenContract,
        functionName: 'token1',
      },
    ],
    allowFailure: false,
  })
  const position: AppTokenPositionDefinition = {
    type: 'app-token-definition',
    networkId,
    address: poolAddress.toLowerCase(),
    tokens: [token0Address, token1Address].map((token) => ({
      address: token.toLowerCase(),
      networkId,
    })),
    displayProps: ({ resolvedTokensByTokenId }) => {
      const token0 =
        resolvedTokensByTokenId[
          getTokenId({
            networkId,
            address: token0Address,
          })
        ]
      const token1 =
        resolvedTokensByTokenId[
          getTokenId({
            networkId,
            address: token1Address,
          })
        ]
      return {
        title: `${token0.symbol} / ${token1.symbol}`,
        description: 'Pool',
        imageUrl:
          'https://raw.githubusercontent.com/valora-inc/dapp-list/ab12ab234b4a6e01eff599c6bd0b7d5b44d6f39d/assets/ubeswap.png',
      }
    },
    pricePerShare: async ({ tokensByTokenId }) => {
      const [[reserve0, reserve1], totalSupply] = await client.multicall({
        contracts: [
          {
            ...poolTokenContract,
            functionName: 'getReserves',
          },
          {
            ...poolTokenContract,
            functionName: 'totalSupply',
          },
        ],
        allowFailure: false,
      })
      const poolToken =
        tokensByTokenId[
          getTokenId({ networkId, isNative: false, address: poolAddress })
        ]
      const token0 =
        tokensByTokenId[
          getTokenId({
            networkId,
            address: token0Address,
          })
        ]
      const token1 =
        tokensByTokenId[
          getTokenId({
            networkId,
            address: token1Address,
          })
        ]
      const reserves = [
        toDecimalNumber(reserve0, token0.decimals),
        toDecimalNumber(reserve1, token1.decimals),
      ]
      const supply = toDecimalNumber(totalSupply, poolToken.decimals)
      const pricePerShare = reserves.map((r) => r.div(supply) as DecimalNumber)
      return pricePerShare
    },
  }

  return position
}

async function getPoolPositionDefinitions(
  networkId: NetworkId,
  address: string,
): Promise<PositionDefinition[]> {
  // Get the pairs from Ubeswap via The Graph
  const { data } = await got
    .post('https://api.thegraph.com/subgraphs/name/ubeswap/ubeswap', {
      json: {
        query: PAIRS_QUERY,
        variables: {
          address: address.toLowerCase(),
        },
      },
    })
    .json<any>()

  const pairs: Address[] = (data.user?.liquidityPositions ?? [])
    .filter((position: any) => Number(position.liquidityTokenBalance) > 0)
    .map((position: any) => position.pair.id)

  // Get all positions
  const positions = await Promise.all(
    pairs.map(async (pair) => {
      return getPoolPositionDefinition(networkId, pair)
    }),
  )

  return positions
}

async function getFarmPositionDefinitions(
  networkId: NetworkId,
  address: string,
): Promise<PositionDefinition[]> {
  // Call balanceOf and totalSupply for each farm stakingAddress
  const data = await client.multicall({
    contracts: farms.flatMap((farm) => [
      {
        address: farm.stakingAddress as Address,
        abi: stakingRewardsAbi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: farm.stakingAddress as Address,
        abi: stakingRewardsAbi,
        functionName: 'totalSupply',
      },
      {
        address: farm.stakingAddress as Address,
        abi: stakingRewardsAbi,
        functionName: 'rewardsToken',
      },
      {
        address: farm.stakingAddress as Address,
        abi: stakingRewardsAbi,
        functionName: 'earned',
        args: [address as Address],
      },
    ]),
    allowFailure: false,
  })

  // Farms for which the user has a balance
  // Note: this captures "single reward" farms,
  // but there are dual and triple reward farms as well
  // which I haven't wrapped my head around yet
  // See https://github.com/Ubeswap/ubeswap-interface/blob/48049267f7160441070ff21ea6c9fedc3a55cfef/src/state/stake/hooks.ts#L144-L171
  const userFarms = farms
    .map((farm, i) => ({
      ...farm,
      balance: data[4 * i] as bigint,
      totalSupply: data[4 * i + 1] as bigint,
      rewardsTokenAddress: data[4 * i + 2] as Address,
      rewardsEarned: data[4 * i + 3] as bigint,
    }))
    .filter((farm) => farm.balance > 0)

  const positions = await Promise.all(
    userFarms.map(async (farm) => {
      const position: ContractPositionDefinition = {
        type: 'contract-position-definition',
        networkId,
        address: farm.stakingAddress.toLowerCase(),
        tokens: [
          { address: farm.lpAddress.toLowerCase(), networkId },
          {
            address: farm.rewardsTokenAddress.toLowerCase(),
            networkId,
            category: 'claimable',
          },
        ],
        displayProps: ({ resolvedTokensByTokenId }) => {
          const poolToken = resolvedTokensByTokenId[
            getTokenId({
              networkId,
              address: farm.lpAddress,
              isNative: false,
            })
          ] as AppTokenPosition
          return {
            title: poolToken.displayProps.title,
            description: 'Farm',
            imageUrl: poolToken.displayProps.imageUrl,
          }
        },
        availableShortcutIds: ['claim-reward'],
        balances: async ({ resolvedTokensByTokenId }) => {
          const poolToken =
            resolvedTokensByTokenId[
              getTokenId({
                address: farm.lpAddress,
                networkId,
                isNative: false,
              })
            ]
          const share = new BigNumber(farm.balance.toString()).div(
            farm.totalSupply.toString(),
          )

          const poolContract = {
            address: farm.lpAddress as Address,
            abi: erc20Abi,
          } as const
          const [poolBalance] = await client.multicall({
            contracts: [
              {
                ...poolContract,
                functionName: 'balanceOf',
                args: [farm.stakingAddress as Address],
              },
            ],
            allowFailure: false,
          })

          const balance = share.times(
            toDecimalNumber(poolBalance, poolToken.decimals),
          ) as DecimalNumber

          const rewardsTokenId = getTokenId({
            address: farm.rewardsTokenAddress,
            networkId,
          })
          const rewardsToken = resolvedTokensByTokenId[rewardsTokenId]
          const rewardsBalance = toDecimalNumber(
            farm.rewardsEarned,
            rewardsToken.decimals,
          )

          return [balance, rewardsBalance]
        },
      }

      return position
    }),
  )

  return positions
}

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'ubeswap',
      name: 'Ubeswap',
      description: 'Decentralized exchange on Celo',
    }
  },
  async getPositionDefinitions(networkId, address) {
    if (networkId !== NetworkId['celo-mainnet']) {
      // dapp is only on Celo, and implementation is hardcoded to Celo mainnet (contract addresses in particular)
      return []
    }
    const [poolDefinitions, farmDefinitions] = await Promise.all([
      getPoolPositionDefinitions(networkId, address),
      getFarmPositionDefinitions(networkId, address),
    ])

    return [...poolDefinitions, ...farmDefinitions]
  },
  getAppTokenDefinition({ networkId, address }: TokenDefinition) {
    // Assume that the address is a pool address
    return getPoolPositionDefinition(networkId, address as Address)
  },
}

export default hook
