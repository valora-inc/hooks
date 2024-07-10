import { Address } from 'viem'
import { getClient } from '../../runtime/client'
import { getTokenId } from '../../runtime/getTokenId'
import { NetworkId } from '../../types/networkId'
import { toDecimalNumber } from '../../types/numbers'
import {
  ContractPositionDefinition,
  PositionsHook,
  UnknownAppTokenError,
} from '../../types/positions'
import { uniV3NftManagerAbi } from './abis/nftManager'
import { userPositionsAbi } from './abis/user-positions'

export const UINT128_MAX_VALUE = 340282366920938463463374607431768211455n

export const UNI_V3_ADDRESSES: {
  [networkId: string]:
    | {
        factory: Address
        nftPositions: Address
        // Custom read-only contract. Code:
        // https://github.com/celo-tracker/celo-tracker-contracts/blob/main/contracts/multicall/UniV3UserPositionsMulticall.sol
        userPositionsMulticall: Address
      }
    | undefined
} = {
  // polygon not enabled yet
  // [NetworkId.polygon]: {
  //   factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  //   nftPositions: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
  //   userPositionsMulticall: '0x78e7F5dF660a445332BdBACC639fAf3C71dBb662',
  // },
  [NetworkId['celo-mainnet']]: {
    factory: '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc',
    nftPositions: '0x3d79EdAaBC0EaB6F08ED885C05Fc0B014290D95A',
    userPositionsMulticall: '0xDD1dC48fEA48B3DE667dD3595624d5af4Fb04694',
  },
  [NetworkId['arbitrum-one']]: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    nftPositions: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
    userPositionsMulticall: '0xd3E0fd14a7d2a2f0E89D99bfc004eAcccfbEB2C1',
  },
  [NetworkId['op-mainnet']]: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    nftPositions: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
    userPositionsMulticall: '0xd3E0fd14a7d2a2f0E89D99bfc004eAcccfbEB2C1',
  },
  [NetworkId['ethereum-mainnet']]: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    nftPositions: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
    userPositionsMulticall: '0xd983fe1235a4c9006ef65eceed7c33069ad35ad0',
  },
}

export async function getUniswapV3PositionDefinitions(
  networkId: NetworkId,
  address: Address,
  userPositionsMulticall: Address,
  nftPositions: Address,
  factory: Address,
  imageUrl: string = 'https://raw.githubusercontent.com/valora-inc/dapp-list/ab12ab234b4a6e01eff599c6bd0b7d5b44d6f39d/assets/uniswap.png',
): Promise<ContractPositionDefinition[]> {
  const client = getClient(networkId)
  const userPools = await client.readContract({
    abi: userPositionsAbi,
    address: userPositionsMulticall,
    functionName: 'getPositions',
    args: [nftPositions, factory, address as Address],
  })

  // TODO: Try to find a way to do this using multicall instead of N requests.
  // It can't be done from the user positions multicall contract because it requires the user to call it.
  // Standard multicall doesn't work because it's a `simlateContract` call.
  const tokensOwed = (
    await Promise.all(
      userPools.map((pool) =>
        client.simulateContract({
          abi: uniV3NftManagerAbi,
          address: nftPositions,
          functionName: 'collect',
          args: [
            {
              tokenId: pool.tokenId,
              recipient: address,
              amount0Max: UINT128_MAX_VALUE,
              amount1Max: UINT128_MAX_VALUE,
            },
          ],
        }),
      ),
    )
  ).map(({ result }) => result as [bigint, bigint])

  return userPools
    .map((pool, index) => ({
      ...pool,
      token0: pool.token0.toLowerCase(),
      token1: pool.token1.toLowerCase(),
      tokensOwed0: tokensOwed[index][0],
      tokensOwed1: tokensOwed[index][1],
    }))
    .filter((pool) => pool.liquidity > 0)
    .map((pool) => {
      return {
        type: 'contract-position-definition',
        networkId,
        address: `${pool.poolAddress}-${pool.tokenId}`,
        tokens: [
          { address: pool.token0, networkId },
          { address: pool.token1, networkId },
          { address: pool.token0, networkId, category: 'claimable' },
          { address: pool.token1, networkId, category: 'claimable' },
        ],
        availableShortcutIds: ['uniswapv3-claim-fees'],
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
          imageUrl,
        }),
        balances: async ({ resolvedTokensByTokenId }) => {
          const token0Decimals =
            resolvedTokensByTokenId[
              getTokenId({
                address: pool.token0,
                networkId,
              })
            ].decimals
          const token1Decimals =
            resolvedTokensByTokenId[
              getTokenId({
                address: pool.token1,
                networkId,
              })
            ].decimals
          return [
            toDecimalNumber(pool.amount0, token0Decimals),
            toDecimalNumber(pool.amount1, token1Decimals),
            toDecimalNumber(pool.tokensOwed0, token0Decimals),
            toDecimalNumber(pool.tokensOwed1, token1Decimals),
          ]
        },
      }
    })
}

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'uniswap',
      name: 'Uniswap',
      description: 'Uniswap pools',
    }
  },
  async getPositionDefinitions(networkId, address) {
    const addresses = UNI_V3_ADDRESSES[networkId]
    if (!addresses) {
      return []
    }
    const { factory, nftPositions, userPositionsMulticall } = addresses
    return getUniswapV3PositionDefinitions(
      networkId,
      address as Address,
      userPositionsMulticall,
      nftPositions,
      factory,
    )
  },
  async getAppTokenDefinition({ networkId, address }) {
    throw new UnknownAppTokenError({ networkId, address })
  },
}

export default hook
