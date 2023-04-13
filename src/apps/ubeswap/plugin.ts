import {
  AppPlugin,
  AppTokenPosition,
  AppTokenPositionDefinition,
  ContractPositionDefinition,
  PositionDefinition,
  TokenDefinition,
} from '../../plugin'
import got from 'got'
import { uniswapV2PairAbi } from './abis/uniswap-v2-pair'
import { FarmInfoEventAbi } from './abis/farm-registry'
import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { erc20Abi } from '../../abis/erc-20'

const FARM_REGISTRY = '0xa2bf67e12EeEDA23C7cA1e5a34ae2441a17789Ec'
const FARM_CREATION_BLOCK = 9840049n

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
    label: ({ resolvedTokens }) => {
      const token0 = resolvedTokens[token0Address.toLowerCase()]
      const token1 = resolvedTokens[token1Address.toLowerCase()]
      return `Pool: ${token0.symbol} / ${token1.symbol}`
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
        Number(reserve0) / 10 ** token0.decimals,
        Number(reserve1) / 10 ** token1.decimals,
      ]
      const pricePerShare = reserves.map(
        // TODO: use BigNumber
        (r) => r / (Number(totalSupply) / 10 ** poolToken.decimals),
      )
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

  const pairs: Address[] = data.user.liquidityPositions
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
  const farmInfoEvents = await client.getLogs({
    address: FARM_REGISTRY,
    event: FarmInfoEventAbi,
    fromBlock: FARM_CREATION_BLOCK,
  })
  // console.log({ farmInfoEvents })

  const farmInfo = farmInfoEvents.map((e) => e.args)

  // console.log({ farmInfo })

  // Call balanceOf and totalSupply for each farm stakingAddress
  const data = await client.multicall({
    contracts: farmInfo.flatMap((farm) => [
      {
        address: farm.stakingAddress,
        // The farms aren't ERC20, but they have a similar interface
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: farm.stakingAddress,
        // The farms aren't ERC20, but they have a similar interface
        abi: erc20Abi,
        functionName: 'totalSupply',
      },
    ]),
    allowFailure: false,
  })

  // Farms for which the user has a balance
  // Note: this captures "single reward" farms,
  // but there are dual and triple reward farms as well
  // which I haven't wrapped my head around yet
  // See https://github.com/Ubeswap/ubeswap-interface/blob/48049267f7160441070ff21ea6c9fedc3a55cfef/src/state/stake/hooks.ts#L144-L171
  const userFarms = farmInfo
    .map((farm, i) => ({
      ...farm,
      balance: data[2 * i],
      totalSupply: data[2 * i + 1],
    }))
    .filter((farm) => farm.balance > 0)

  // console.log({ userFarms })

  const positions = await Promise.all(
    userFarms.map(async (farm) => {
      const position: ContractPositionDefinition = {
        type: 'contract-position-definition',
        network,
        address: farm.stakingAddress.toLowerCase(),
        tokens: [{ address: farm.lpAddress.toLowerCase(), network }],
        label: ({ resolvedTokens }) => {
          const poolToken = resolvedTokens[farm.lpAddress.toLowerCase()]
          return `Farm: ${(poolToken as AppTokenPosition).label}`
        },
        balances: async ({ resolvedTokens }) => {
          const poolToken = resolvedTokens[farm.lpAddress.toLowerCase()]
          const share = Number(farm.balance) / Number(farm.totalSupply)

          const poolContract = {
            address: farm.lpAddress,
            abi: erc20Abi,
          } as const
          const [poolBalance] = await client.multicall({
            contracts: [
              {
                ...poolContract,
                functionName: 'balanceOf',
                args: [farm.stakingAddress],
              },
            ],
            allowFailure: false,
          })

          const balance =
            (share * Number(poolBalance)) / 10 ** poolToken.decimals

          return [balance.toString()]
        },
      }

      return position
    }),
  )

  return positions
}

const plugin: AppPlugin = {
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

export default plugin
