import {
  PositionsHook,
  AppTokenPositionDefinition,
  UnknownAppTokenError,
  TokenDefinition,
  ContractPositionDefinition,
} from '../../types/positions'
import { Address } from 'viem'
import {
  DecimalNumber,
  toDecimalNumber,
  toSerializedDecimalNumber,
} from '../../types/numbers'
import BigNumber from 'bignumber.js'
import { getClient } from '../../runtime/client'
import { getTokenId } from '../../runtime/getTokenId'
import { getAllbridgeTokenInfo } from './api'
import { poolAbi } from './abis/pool'
import {
  ALLBRIDGE_LOGO,
  ALLBRIDGE_POOLS_BASE_URL,
  ALLBRIGE_CONTRACT_CREATED_AT,
  NETWORK_ID_TO_ALLBRIDGE_CHAIN,
} from './constants'

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'allbridge',
      name: 'Allbridge',
      description: '',
    }
  },
  async getPositionDefinitions({networkId, address, t}) {
    const allbridgeTokenInfo = (await getAllbridgeTokenInfo({ networkId }))
      ?.tokens
    if (!allbridgeTokenInfo) {
      return []
    }

    const client = getClient(networkId)

    const [balances, rewards, totalSupplies, lpTokenDecimals] =
      await Promise.all([
        Promise.all(
          allbridgeTokenInfo.map((tokenInfo) => {
            return address
              ? client.readContract({
                  address: tokenInfo.poolAddress,
                  abi: poolAbi,
                  functionName: 'balanceOf',
                  args: [address as Address],
                })
              : undefined
          }),
        ),
        Promise.all(
          allbridgeTokenInfo.map((tokenInfo) => {
            return address
              ? client.readContract({
                  address: tokenInfo.poolAddress,
                  abi: poolAbi,
                  functionName: 'pendingReward',
                  args: [address as Address],
                })
              : undefined
          }),
        ),
        Promise.all(
          allbridgeTokenInfo.map((tokenInfo) => {
            return client.readContract({
              address: tokenInfo.poolAddress,
              abi: poolAbi,
              functionName: 'totalSupply',
              args: [],
            })
          }),
        ),
        Promise.all(
          allbridgeTokenInfo.map((tokenInfo) => {
            return client.readContract({
              address: tokenInfo.poolAddress,
              abi: poolAbi,
              functionName: 'decimals',
              args: [],
            })
          }),
        ),
      ])

    return allbridgeTokenInfo.flatMap((tokenInfo, i) => {
      const apr = new BigNumber(tokenInfo.apr7d).toNumber() * 100

      const balanceOf = balances[i]
      const pendingReward = rewards[i]

      const showLpToken = !address || (!!balanceOf && balanceOf > 0)
      const showReward = !!pendingReward && pendingReward > 0
      return [
        showLpToken &&
          ({
            type: 'app-token-definition',
            networkId,
            address: tokenInfo.poolAddress.toLowerCase(),
            tokens: [
              { address: tokenInfo.tokenAddress.toLowerCase(), networkId },
            ],
            availableShortcutIds: ['deposit', 'withdraw'],
            displayProps: {
              title: tokenInfo.symbol,
              description: `Supplied (APR: ${apr.toFixed(2)}%)`,
              imageUrl: ALLBRIDGE_LOGO,
            },
            dataProps: {
              manageUrl: `${ALLBRIDGE_POOLS_BASE_URL}?chain=${NETWORK_ID_TO_ALLBRIDGE_CHAIN[networkId]}`,
              contractCreatedAt:
                ALLBRIGE_CONTRACT_CREATED_AT[
                  getTokenId({
                    networkId,
                    address: tokenInfo.poolAddress.toLowerCase(),
                  })
                ],
              tvl: toSerializedDecimalNumber(
                toDecimalNumber(totalSupplies[i], lpTokenDecimals[i]),
              ),
              yieldRates: [
                {
                  percentage: apr,
                  label: t ? t('yieldRates.earningsApr') : 'Earnings APR',
                  tokenId: getTokenId({
                    networkId,
                    address: tokenInfo.tokenAddress.toLowerCase(),
                  }),
                },
              ],
              earningItems: pendingReward
                ? [
                    {
                      amount: toDecimalNumber(
                        pendingReward,
                        tokenInfo.decimals,
                      ),
                      label: t ? t('earningItems.earnings') : 'Earnings',
                      tokenId: getTokenId({
                        networkId,
                        address: tokenInfo.tokenAddress.toLowerCase(),
                      }),
                    },
                  ]
                : [],
              depositTokenId: getTokenId({
                networkId,
                address: tokenInfo.tokenAddress.toLowerCase(),
              }),
              withdrawTokenId: getTokenId({
                networkId,
                address: tokenInfo.poolAddress.toLowerCase(),
              }),
            },
            pricePerShare: [new BigNumber(1) as DecimalNumber],
          } satisfies AppTokenPositionDefinition),
        showReward &&
          ({
            type: 'contract-position-definition',
            networkId,
            address: tokenInfo.poolAddress.toLowerCase(),
            extraId: 'supply-incentives',
            tokens: [
              {
                address: tokenInfo.tokenAddress.toLowerCase(),
                networkId,
                category: 'claimable',
              },
            ],
            availableShortcutIds: ['claim-rewards'],
            balances: [toDecimalNumber(pendingReward, tokenInfo.decimals)],
            displayProps: {
              title: `${tokenInfo.symbol} supply incentives`,
              description: 'Rewards for supplying',
              imageUrl: ALLBRIDGE_LOGO,
            },
          } satisfies ContractPositionDefinition),
      ].filter((x) => !!x)
    })
  },
  async getAppTokenDefinition({ networkId, address }: TokenDefinition) {
    throw new UnknownAppTokenError({ networkId, address })
  },
}

export default hook
