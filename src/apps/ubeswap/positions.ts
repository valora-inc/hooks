import {
  PositionsHook,
  AppTokenPosition,
  AppTokenPositionDefinition,
  ContractPositionDefinition,
  PositionDefinition,
  TokenDefinition,
} from '../../positions'
import got from 'got'
import BigNumber from 'bignumber.js'
import { uniswapV2PairAbi } from './abis/uniswap-v2-pair'
import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { erc20Abi } from '../../abis/erc-20'
import { DecimalNumber, toDecimalNumber } from '../../numbers'
import { stakingRewardsAbi } from './abis/staking-rewards'
import farms from './data/farms.json'

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
  network: string,
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
    network,
    address: poolAddress.toLowerCase(),
    tokens: [token0Address, token1Address].map((token) => ({
      address: token.toLowerCase(),
      network,
    })),
    displayProps: ({ resolvedTokens }) => {
      const token0 = resolvedTokens[token0Address.toLowerCase()]
      const token1 = resolvedTokens[token1Address.toLowerCase()]
      return {
        title: `${token0.symbol} / ${token1.symbol}`,
        description: 'Pool',
        imageUrl:
          'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
      }
    },
    pricePerShare: async ({ tokensByAddress }) => {
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
      const poolToken = tokensByAddress[poolAddress.toLowerCase()]
      const token0 = tokensByAddress[token0Address.toLowerCase()]
      const token1 = tokensByAddress[token1Address.toLowerCase()]
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
  network: string,
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

  // console.log({ pairs })

  // Get all positions
  const positions = await Promise.all(
    pairs.map(async (pair) => {
      return getPoolPositionDefinition(network, pair)
    }),
  )

  return positions
}

async function getFarmPositionDefinitions(
  network: string,
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

  // console.log({ userFarms })

  const positions = await Promise.all(
    userFarms.map(async (farm) => {
      const position: ContractPositionDefinition = {
        type: 'contract-position-definition',
        network,
        address: farm.stakingAddress.toLowerCase(),
        tokens: [
          { address: farm.lpAddress.toLowerCase(), network },
          {
            address: farm.rewardsTokenAddress.toLowerCase(),
            network,
            category: 'claimable',
          },
        ],
        displayProps: ({ resolvedTokens }) => {
          const poolToken = resolvedTokens[
            farm.lpAddress.toLowerCase()
          ] as AppTokenPosition
          return {
            title: poolToken.displayProps.title,
            description: 'Farm',
            imageUrl: poolToken.displayProps.imageUrl,
          }
        },
        availableShortcutIds: ['claim-reward'],
        balances: async ({ resolvedTokens }) => {
          const poolToken = resolvedTokens[farm.lpAddress.toLowerCase()]
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

          const rewardsToken =
            resolvedTokens[farm.rewardsTokenAddress.toLowerCase()]
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
  async getPositionDefinitions(network, address) {
    const [poolDefinitions, farmDefinitions] = await Promise.all([
      getPoolPositionDefinitions(network, address),
      getFarmPositionDefinitions(network, address),
    ])

    return [...poolDefinitions, ...farmDefinitions]
  },
  getAppTokenDefinition({ network, address }: TokenDefinition) {
    // Assume that the address is a pool address
    return getPoolPositionDefinition(network, address as Address)
  },
}

export default hook
