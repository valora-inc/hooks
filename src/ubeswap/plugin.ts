import { AppPlugin, AppTokenPosition, BaseToken } from '../plugin'
import got from 'got'
import { Contract, providers } from 'ethers'
import uniswapV2PairAbi from './abis/uniswap-v2-pair.json'
import {
  configs as exchangesConfigs,
  createNewManager,
  PriceByAddress,
} from '@valora/exchanges'

const FULL_NODE_URL = 'https://forno.celo.org'

// Connect to the Celo network
const provider = new providers.JsonRpcProvider(FULL_NODE_URL)

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
  address: string,
  baseTokenPrices: PriceByAddress,
): Promise<Omit<BaseToken, 'balance'>> {
  const tokenContract = new Contract(address, uniswapV2PairAbi, provider)
  const symbol = await tokenContract.symbol()
  const decimals = await tokenContract.decimals()
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

    const pairs: string[] = data.user.liquidityPositions.map(
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
        const poolTokenContract = new Contract(pair, uniswapV2PairAbi, provider)
        const balance = await poolTokenContract.balanceOf(address)
        if (Number(balance) === 0) {
          return null
        }
        const decimals = await poolTokenContract.decimals()
        const symbol = await poolTokenContract.symbol()
        const token0Address = (await poolTokenContract.token0()).toLowerCase()
        const token1Address = (await poolTokenContract.token1()).toLowerCase()
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
        const [reserve0, reserve1] = await poolTokenContract.getReserves()
        const totalSupply = await poolTokenContract.totalSupply()
        const reserves = [
          Number(reserve0) / 10 ** token0.decimals,
          Number(reserve1) / 10 ** token1.decimals,
        ]
        const pricePerShare = reserves.map(
          (r) => r / (totalSupply / 10 ** decimals),
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
