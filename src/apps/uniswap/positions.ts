import { Address } from 'viem'
import { toDecimalNumber } from '../../types/numbers'
import { PositionsHook } from '../../types/positions'
import { userPositionsAbi } from './abis/user-positions'
import { getClient } from '../../runtime/client'
import { NetworkId } from '../../types/networkId'
import { getTokenId } from '../../runtime/getTokenId'

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
  async getPositionDefinitions(networkId, address) {
    if (networkId !== NetworkId['celo-mainnet']) {
      // hook implementation currently hardcoded to Celo mainnet (contract addresses in particular)
      return []
    }
    const client = getClient(networkId)
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
      .filter((pool) => pool.liquidity > 0)
      .map((pool) => {
        return {
          type: 'contract-position-definition',
          networkId,
          address: pool.poolAddress,
          tokens: [
            { address: pool.token0, networkId },
            { address: pool.token1, networkId },
          ],
          displayProps: ({ resolvedTokensByTokenId }) => ({
            title: `${
              resolvedTokensByTokenId[
                getTokenId({
                  address: pool.token0,
                  networkId,
                })
              ].symbol
            } / ${
              resolvedTokensByTokenId[
                getTokenId({
                  address: pool.token1,
                  networkId,
                })
              ].symbol
            }`,
            description: 'Pool',
            imageUrl:
              'https://raw.githubusercontent.com/valora-inc/dapp-list/ab12ab234b4a6e01eff599c6bd0b7d5b44d6f39d/assets/uniswap.png',
          }),
          balances: async ({ resolvedTokensByTokenId }) => {
            return [
              toDecimalNumber(
                pool.amount0,
                resolvedTokensByTokenId[
                  getTokenId({
                    address: pool.token0,
                    networkId,
                  })
                ].decimals,
              ),
              toDecimalNumber(
                pool.amount1,
                resolvedTokensByTokenId[
                  getTokenId({
                    address: pool.token1,
                    networkId,
                  })
                ].decimals,
              ),
            ]
          },
        }
      })
  },
}

export default hook
