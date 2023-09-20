import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { toDecimalNumber } from '../../types/numbers'
import { PositionsHook } from '../../types/positions'
import { userPositionsAbi } from './abis/user-positions'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

// Standard Uniswap v3 addresses on CELO
const UNISWAP_V3_FACTORY_ADDRESS = '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc'
const UNISWAP_V3_NFT_POSITIONS_MANAGER_ADDRESS =
  '0x3d79EdAaBC0EaB6F08ED885C05Fc0B014290D95A'
// Custom read-only contract. Code:
// https://github.com/celo-tracker/celo-tracker-contracts/blob/main/contracts/multicall/UniV3UserPositionsMulticall.sol
const USER_POSITIONS_MULTICALL_ADDRESS =
  '0x0588Cc1eD79e3c754F4180E78554691E82c2dEdB'

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'uniswap',
      name: 'Uniswap',
      description: 'Uniswap pools',
    }
  },
  async getPositionDefinitions(network, address) {
    const userPools = await client.readContract({
      abi: userPositionsAbi,
      address: USER_POSITIONS_MULTICALL_ADDRESS,
      functionName: 'getPositions',
      args: [
        UNISWAP_V3_NFT_POSITIONS_MANAGER_ADDRESS,
        UNISWAP_V3_FACTORY_ADDRESS,
        address as Address,
      ],
    })
    return userPools
      .map((pool) => ({
        ...pool,
        token0: pool.token0.toLowerCase(),
        token1: pool.token1.toLowerCase(),
      }))
      .map((pool) => {
        return {
          type: 'contract-position-definition',
          network,
          address: pool.poolAddress,
          tokens: [
            { address: pool.token0, network },
            { address: pool.token1, network },
          ],
          displayProps: ({ resolvedTokens }) => ({
            title: `${resolvedTokens[pool.token0].symbol} / ${
              resolvedTokens[pool.token1].symbol
            }`,
            description: 'Pool',
            imageUrl:
              'https://raw.githubusercontent.com/valora-inc/dapp-list/ab12ab234b4a6e01eff599c6bd0b7d5b44d6f39d/assets/uniswap.png',
          }),
          balances: async ({ resolvedTokens }) => {
            return [
              toDecimalNumber(
                pool.amount0,
                resolvedTokens[pool.token0].decimals,
              ),
              toDecimalNumber(
                pool.amount1,
                resolvedTokens[pool.token1].decimals,
              ),
            ]
          },
        }
      })
  },
}

export default hook
