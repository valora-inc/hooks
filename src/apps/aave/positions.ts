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
import { uiPoolDataProviderV3Abi } from './abis/ui-pool-data-provider-v3'
import { getTokenId } from '../../runtime/getTokenId'
import { uiIncentiveDataProviderV3Abi } from './abis/ui-incentive-data-provider'
import {
  AAVE_CONTRACT_CREATED_AT,
  AAVE_LOGO,
  AAVE_POOLS_BASE_URL,
  AAVE_V3_ADDRESSES_BY_NETWORK_ID,
  NETWORK_ID_TO_AAVE_MARKET_NAME,
} from './constants'
import { aTokenAbi } from './abis/atoken'

const COMPOUND_PERIOD = 365 * 24 * 60 * 60 // 1 year in seconds

// Get APY from APR, both in percentage (0-100)
function getApy(apr: number) {
  // Note: not using BigNumber here as it takes too long to calculate
  return ((1 + apr / 100 / COMPOUND_PERIOD) ** COMPOUND_PERIOD - 1) * 100
}

// The chain data is in RAY units (1e27) and non compounded
// https://docs.aave.com/developers/guides/rates-guide#formatting-rates
function getApyFromRayApr(apr: bigint) {
  return getApy(new BigNumber(apr.toString()).div(1e27).times(100).toNumber())
}

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'aave',
      name: 'Aave',
      description: '',
    }
  },
  async getPositionDefinitions(networkId, address) {
    const aaveAddresses = AAVE_V3_ADDRESSES_BY_NETWORK_ID[networkId]
    if (!aaveAddresses) {
      return []
    }

    const client = getClient(networkId)

    const [reservesData] = await client.readContract({
      address: aaveAddresses.uiPoolDataProvider,
      abi: uiPoolDataProviderV3Abi,
      functionName: 'getReservesData',
      args: [aaveAddresses.poolAddressesProvider],
    })

    const [userReserveData, userIncentivesData] = address
      ? await client.multicall({
          contracts: [
            {
              address: aaveAddresses.uiPoolDataProvider,
              abi: uiPoolDataProviderV3Abi,
              functionName: 'getUserReservesData',
              args: [aaveAddresses.poolAddressesProvider, address as Address],
            },
            {
              address: aaveAddresses.uiIncentiveDataProvider,
              abi: uiIncentiveDataProviderV3Abi,
              functionName: 'getUserReservesIncentivesData',
              args: [aaveAddresses.poolAddressesProvider, address as Address],
            },
          ],
          allowFailure: false,
        })
      : [undefined, undefined]

    const [totalSupplies, lpTokenDecimals] = await Promise.all([
      await Promise.all(
        reservesData.map(async ({ aTokenAddress }) => {
          return client.readContract({
            address: aTokenAddress,
            abi: aTokenAbi,
            functionName: 'totalSupply',
            args: [],
          })
        }),
      ),
      await Promise.all(
        reservesData.map(async ({ aTokenAddress }) => {
          return client.readContract({
            address: aTokenAddress,
            abi: aTokenAbi,
            functionName: 'decimals',
            args: [],
          })
        }),
      ),
    ])

    const manageUrl =
      AAVE_POOLS_BASE_URL +
      (NETWORK_ID_TO_AAVE_MARKET_NAME[networkId]
        ? `?marketName=${NETWORK_ID_TO_AAVE_MARKET_NAME[networkId]}`
        : '')
    return reservesData.flatMap((reserveData, i) => {
      const supplyApy = getApyFromRayApr(reserveData.liquidityRate)
      const variableBorrowApy = getApyFromRayApr(reserveData.variableBorrowRate)
      const stableBorrowApy = getApyFromRayApr(
        userReserveData?.[i].stableBorrowRate || reserveData.stableBorrowRate,
      )

      // Include a token if the user has a balance
      // or if no user data is available (when querying all positions)
      const useAToken =
        !userReserveData || userReserveData[i].scaledATokenBalance > 0n
      const useVariableDebt =
        !userReserveData || userReserveData[i].scaledVariableDebt > 0n
      const useStableDebt =
        !userReserveData || userReserveData[i].principalStableDebt > 0n

      const userIncentives = userIncentivesData?.[i]
      const aTokenRewardsInfo =
        userIncentives?.aTokenIncentivesUserData.userRewardsInformation.filter(
          (info) => info.userUnclaimedRewards > 0n,
        )
      const variableDebtRewardsInfo =
        userIncentives?.vTokenIncentivesUserData.userRewardsInformation.filter(
          (info) => info.userUnclaimedRewards > 0n,
        )
      const stableDebtRewardsInfo =
        userIncentives?.sTokenIncentivesUserData.userRewardsInformation.filter(
          (info) => info.userUnclaimedRewards > 0n,
        )

      return [
        // AToken
        useAToken &&
          ({
            type: 'app-token-definition',
            networkId,
            address: reserveData.aTokenAddress.toLowerCase(),
            tokens: [
              { address: reserveData.underlyingAsset.toLowerCase(), networkId },
            ],
            availableShortcutIds: ['deposit', 'withdraw'],
            displayProps: {
              title: reserveData.symbol,
              description: `Supplied (APY: ${supplyApy.toFixed(2)}%)`,
              imageUrl: AAVE_LOGO,
            },
            dataProps: {
              manageUrl,
              contractCreatedAt:
                AAVE_CONTRACT_CREATED_AT[
                  getTokenId({
                    networkId,
                    address: reserveData.aTokenAddress.toLowerCase(),
                  })
                ],
              tvl: toSerializedDecimalNumber(
                toDecimalNumber(totalSupplies[i], lpTokenDecimals[i]),
              ),
              yieldRates: [
                {
                  percentage: supplyApy,
                  label: 'Earnings APY', // TODO(ACT-1331): Replace with localized string
                  tokenId: getTokenId({
                    networkId,
                    address: reserveData.underlyingAsset.toLowerCase(),
                  }),
                },
              ],
              earningItems: aTokenRewardsInfo?.length
                ? aTokenRewardsInfo.map((info) => ({
                    amount: toDecimalNumber(
                      info.userUnclaimedRewards,
                      info.rewardTokenDecimals,
                    ),
                    label: 'Rewards', // TODO(ACT-1331): Replace with localized string
                    tokenId: getTokenId({
                      networkId,
                      address: info.rewardTokenAddress.toLowerCase(),
                    }),
                  }))
                : [],
              depositTokenId: getTokenId({
                networkId,
                address: reserveData.underlyingAsset.toLowerCase(),
              }),
              withdrawTokenId: getTokenId({
                networkId,
                address: reserveData.aTokenAddress.toLowerCase(),
              }),
            },
            pricePerShare: [new BigNumber(1) as DecimalNumber],
          } satisfies AppTokenPositionDefinition),
        // ATokens incentives
        aTokenRewardsInfo?.length &&
          ({
            type: 'contract-position-definition',
            networkId,
            address: reserveData.aTokenAddress.toLowerCase(),
            extraId: 'supply-incentives',
            tokens: aTokenRewardsInfo.map((info) => ({
              address: info.rewardTokenAddress.toLowerCase(),
              networkId,
              category: 'claimable',
            })),
            availableShortcutIds: ['claim-rewards'],
            balances: aTokenRewardsInfo.map((info) =>
              toDecimalNumber(
                info.userUnclaimedRewards,
                info.rewardTokenDecimals,
              ),
            ),
            displayProps: {
              title: `${reserveData.symbol} supply incentives`,
              description: 'Rewards for supplying',
              imageUrl: AAVE_LOGO,
            },
          } satisfies ContractPositionDefinition),
        // Variable debt token
        useVariableDebt &&
          ({
            type: 'app-token-definition',
            networkId,
            address: reserveData.variableDebtTokenAddress.toLowerCase(),
            tokens: [{ address: reserveData.underlyingAsset, networkId }],
            displayProps: {
              title: `${reserveData.symbol} debt`,
              description: `Borrowed variable (APY: ${variableBorrowApy.toFixed(
                2,
              )}%)`,
              imageUrl: AAVE_LOGO,
            },
            // TODO: update runtime so we can specify a negative balance for debt
            // instead of using a negative pricePerShare
            pricePerShare: [new BigNumber(-1) as DecimalNumber],
          } satisfies AppTokenPositionDefinition),
        // Variable debt incentives
        variableDebtRewardsInfo?.length &&
          ({
            type: 'contract-position-definition',
            networkId,
            address: reserveData.variableDebtTokenAddress.toLowerCase(),
            extraId: 'variable-debt-incentives',
            tokens: variableDebtRewardsInfo.map((info) => ({
              address: info.rewardTokenAddress.toLowerCase(),
              networkId,
              category: 'claimable',
            })),
            availableShortcutIds: ['claim-rewards'],
            balances: variableDebtRewardsInfo.map((info) =>
              toDecimalNumber(
                info.userUnclaimedRewards,
                info.rewardTokenDecimals,
              ),
            ),
            displayProps: {
              title: `${reserveData.symbol} variable debt incentives`,
              description: 'Rewards for borrowing',
              imageUrl: AAVE_LOGO,
            },
          } satisfies ContractPositionDefinition),
        // Stable debt token
        useStableDebt &&
          ({
            type: 'app-token-definition',
            networkId,
            address: reserveData.stableDebtTokenAddress.toLowerCase(),
            tokens: [{ address: reserveData.underlyingAsset, networkId }],
            displayProps: {
              title: `${reserveData.symbol} debt`,
              description: `Borrowed stable (APY: ${stableBorrowApy.toFixed(
                2,
              )}%)`,
              imageUrl: AAVE_LOGO,
            },
            // TODO: similar as comment above for variable debt
            pricePerShare: [new BigNumber(-1) as DecimalNumber],
          } satisfies AppTokenPositionDefinition),
        // Stable debt incentives
        stableDebtRewardsInfo?.length &&
          ({
            type: 'contract-position-definition',
            networkId,
            address: reserveData.stableDebtTokenAddress.toLowerCase(),
            extraId: 'stable-debt-incentives',
            tokens: stableDebtRewardsInfo.map((info) => ({
              address: info.rewardTokenAddress.toLowerCase(),
              networkId,
              category: 'claimable',
            })),
            availableShortcutIds: ['claim-rewards'],
            balances: stableDebtRewardsInfo.map((info) =>
              toDecimalNumber(
                info.userUnclaimedRewards,
                info.rewardTokenDecimals,
              ),
            ),
            displayProps: {
              title: `${reserveData.symbol} stable debt incentives`,
              description: 'Rewards for borrowing',
              imageUrl: AAVE_LOGO,
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
