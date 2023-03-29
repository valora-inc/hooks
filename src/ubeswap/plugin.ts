import {
  AppPlugin,
  AppTokenPosition,
  BaseToken,
  ContractPosition,
  Position,
} from '../plugin'
import got from 'got'
import { uniswapV2PairAbi } from './abis/uniswap-v2-pair'
import { FarmInfoEventAbi } from './abis/farm-registry'
import {
  configs as exchangesConfigs,
  createNewManager,
  PriceByAddress,
} from '@valora/exchanges'
import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { erc20Abi } from '../abis/erc-20'

const FULL_NODE_URL = 'https://forno.celo.org'

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
      }
    }
  }
`

async function getTokenInfo(
  network: string,
  address: Address,
  baseTokenPrices: PriceByAddress,
): Promise<Omit<BaseToken, 'balance'>> {
  const addressLower = address.toLowerCase()
  const tokenContract = {
    address,
    abi: erc20Abi,
  } as const
  const [symbol, decimals] = await client.multicall({
    contracts: [
      {
        ...tokenContract,
        functionName: 'symbol',
      },
      {
        ...tokenContract,
        functionName: 'decimals',
      },
    ],
    allowFailure: false,
  })
  return {
    type: 'base-token',
    network,
    address: addressLower,
    symbol,
    decimals,
    priceUsd: Number(baseTokenPrices[addressLower]?.toString() ?? 0),
  }
}

function tokenWithUnderlyingBalance(
  token: Omit<BaseToken, 'balance'>,
  decimals: number,
  balance: string,
  pricePerShare: number,
) {
  return {
    ...token,
    balance: (
      (Number(balance) / 10 ** decimals) *
      10 ** token.decimals *
      pricePerShare
    ).toFixed(0),
  }
}

let baseTokenPricesPromise: Promise<PriceByAddress> | undefined

async function getBaseTokenPrices() {
  if (baseTokenPricesPromise) {
    return baseTokenPricesPromise
  }

  // Get base token prices
  // console.log('Getting base token prices...')
  const baseTokensPriceManager = createNewManager({
    ...exchangesConfigs.mainnet,
    fullNodeUrl: FULL_NODE_URL,
    ubeswap: {
      ...exchangesConfigs.mainnet.ubeswap,
      minLiquidity: 10_000,
      maxConcurrency: 10,
    },
  })

  baseTokenPricesPromise = baseTokensPriceManager.calculatecUSDPrices()

  return baseTokenPricesPromise
}

async function getPoolPosition(
  network: string,
  poolAddress: Address,
  depositorAddress: Address,
  share = 1, // applies a share to the depositor's balance
): Promise<AppTokenPosition | null> {
  const poolTokenContract = {
    address: poolAddress,
    abi: uniswapV2PairAbi,
  } as const
  const [
    balance,
    symbol,
    decimals,
    token0Address,
    token1Address,
    [reserve0, reserve1],
    totalSupply,
  ] = await client.multicall({
    contracts: [
      {
        ...poolTokenContract,
        functionName: 'balanceOf',
        args: [depositorAddress],
      },
      {
        ...poolTokenContract,
        functionName: 'symbol',
      },
      {
        ...poolTokenContract,
        functionName: 'decimals',
      },
      {
        ...poolTokenContract,
        functionName: 'token0',
      },
      {
        ...poolTokenContract,
        functionName: 'token1',
      },
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

  if (balance === 0n) {
    return null
  }
  const balanceWithShare = Number(balance) * share
  const baseTokenPrices = await getBaseTokenPrices()
  const token0 = await getTokenInfo(network, token0Address, baseTokenPrices)
  const token1 = await getTokenInfo(network, token1Address, baseTokenPrices)
  const reserves = [
    Number(reserve0) / 10 ** token0.decimals,
    Number(reserve1) / 10 ** token1.decimals,
  ]
  const pricePerShare = reserves.map(
    // TODO: use BigNumber
    (r) => r / (Number(totalSupply) / 10 ** decimals),
  )
  const priceUsd =
    Number(token0.priceUsd) * pricePerShare[0] +
    Number(token1.priceUsd) * pricePerShare[1]

  const position: AppTokenPosition = {
    type: 'app-token',
    network,
    address: poolAddress,
    symbol,
    decimals,
    label: `Pool: ${token0.symbol} / ${token1.symbol}`,

    tokens: [token0, token1].map((token, i) =>
      tokenWithUnderlyingBalance(
        token,
        decimals,
        balanceWithShare.toString(),
        pricePerShare[i],
      ),
    ),
    pricePerShare,
    priceUsd,
    balance: balanceWithShare.toString(),
    supply: totalSupply.toString(),
  }

  return position
}

async function getPoolPositions(
  network: string,
  address: string,
): Promise<Position[]> {
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

  const pairs: Address[] = data.user.liquidityPositions.map(
    (position: any) => position.pair.id,
  )

  // console.log({ pairs })

  // Get all positions
  const positions = await Promise.all(
    pairs.map(async (pair) => {
      return getPoolPosition(network, pair, address as Address)
    }),
  )

  return positions.filter((p): p is Exclude<typeof p, null> => p !== null)
}

async function getFarmPositions(
  network: string,
  address: string,
): Promise<Position[]> {
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
      const pool = await getPoolPosition(
        network,
        farm.lpAddress.toLowerCase() as Address,
        farm.stakingAddress.toLowerCase() as Address,
        // TODO: use BigNumber
        Number(farm.balance) / Number(farm.totalSupply),
      )
      if (!pool) {
        return null
      }

      const balance = Number(pool.balance) / 10 ** pool.decimals
      const balanceUsd = balance * pool.priceUsd

      const position: ContractPosition = {
        type: 'contract-position',
        address: farm.stakingAddress.toLowerCase(),
        label: `Farm: ${pool.label}`,
        tokens: [pool],
        balanceUsd: balanceUsd.toString(),
      }

      return position
    }),
  )

  return positions.filter((p): p is Exclude<typeof p, null> => p !== null)
}

export const ubeswapPlugin: AppPlugin = {
  getInfo() {
    return {
      id: 'ubeswap',
      name: 'Ubeswap',
      description: 'Decentralized exchange on Celo',
    }
  },
  async getPositions(network, address) {
    // Don't yet fetch in parallel, as it ends up doing quite a few RPC calls
    const poolPositions = await getPoolPositions(network, address)
    const farmPositions = await getFarmPositions(network, address)

    return [...poolPositions, ...farmPositions]
  },
}
