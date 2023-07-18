import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import {
  AppTokenPositionDefinition,
  PositionsHook,
  TokenDefinition,
} from '../../types/positions'
import { curveTripoolAbi } from './abis/curve-tripool'
import { curvePairAbi } from './abis/curve-pair'
import { DecimalNumber, toDecimalNumber } from '../../types/numbers'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

const CURVE_POOLS_WITH_SIZES: Record<Address, 2 | 3> = {
  '0x9be5da31c7a42d7e045189ac1822d1fa5838e635': 2,
  '0xf4cab10dc19695aace14b7a16d7705b600ad5f73': 2,
  '0x32fd7e563c6521ab4d59ce3277bcfbe3317cfd63': 3,
}

async function getPoolPositionDefinition(
  network: string,
  poolAddress: Address,
) {
  const poolSize = CURVE_POOLS_WITH_SIZES[poolAddress.toLowerCase() as Address]
  const poolTokenContract = {
    address: poolAddress,
    abi: poolSize === 3 ? curveTripoolAbi : curvePairAbi,
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
  getPositionDefinitions(network, _address) {
    return Promise.all(
      Object.keys(CURVE_POOLS_WITH_SIZES).map((poolAddress) =>
        getPoolPositionDefinition(network, poolAddress as Address),
      ),
    )
  },
  getAppTokenDefinition({ network, address }: TokenDefinition) {
    // Assume that the address is a pool address
    return getPoolPositionDefinition(network, address as Address)
  },
}

export default hook
