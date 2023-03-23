import { AppPlugin, AppTokenPosition, BaseToken } from '../plugin'
import got from 'got'
import { uniswapV2PairAbi } from './abis/uniswap-v2-pair'
import {
  configs as exchangesConfigs,
  createNewManager,
  PriceByAddress,
} from '@valora/exchanges'
import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'

const FULL_NODE_URL = 'https://forno.celo.org'

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
  const tokenContract = {
    address,
    abi: uniswapV2PairAbi,
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
    address,
    symbol,
    decimals,
    priceUsd: Number(baseTokenPrices[address]?.toString() ?? 0),
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

export const ubeswapPlugin: AppPlugin = {
  getInfo() {
    return {
      id: 'ubeswap',
      name: 'Ubeswap',
      description: 'Decentralized exchange on Celo',
    }
  },
  async getPositions(network, address) {
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
    const baseTokenPrices = await baseTokensPriceManager.calculatecUSDPrices()

    // console.log('baseTokenPrices', baseTokenPrices)

    // Get all positions
    const positions = await Promise.all(
      pairs.map(async (pair) => {
        const poolTokenContract = {
          address: pair,
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
              args: [address as Address],
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

        if (Number(balance) === 0) {
          return null
        }
        const token0 = await getTokenInfo(
          network,
          token0Address,
          baseTokenPrices,
        )
        const token1 = await getTokenInfo(
          network,
          token1Address,
          baseTokenPrices,
        )
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
          address: pair,
          symbol,
          decimals,
          label: `Pool: ${token0.symbol} / ${token1.symbol}`,

          tokens: [token0, token1].map((token, i) =>
            tokenWithUnderlyingBalance(
              token,
              decimals,
              balance.toString(),
              pricePerShare[i],
            ),
          ),
          pricePerShare,
          priceUsd,
          balance: balance.toString(),
          supply: totalSupply.toString(),
        }

        return position
      }),
    )

    // console.log('positions', JSON.stringify(positions, null, ' '))

    return positions.filter((p): p is Exclude<typeof p, null> => p !== null)
  },
}
