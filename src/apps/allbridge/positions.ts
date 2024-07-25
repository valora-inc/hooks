import {
    PositionsHook,
    AppTokenPositionDefinition,
    UnknownAppTokenError,
    TokenDefinition,
    ContractPositionDefinition,
  } from '../../types/positions'
  import { Address } from 'viem'
  import { DecimalNumber, toDecimalNumber } from '../../types/numbers'
  import BigNumber from 'bignumber.js'
  import { getClient } from '../../runtime/client'
  import { uiPoolDataProviderV3Abi } from './abis/ui-pool-data-provider-v3'
  import { getTokenId } from '../../runtime/getTokenId'
  import { uiIncentiveDataProviderV3Abi } from './abis/ui-incentive-data-provider'
  import { ALLBRIDGE_ADDRESSES_BY_NETWORK_ID } from './constants'
  
  const ALLBRIDGE_LOGO = '???'
  
  const hook: PositionsHook = {
    getInfo() {
      return {
        id: 'allbridge',
        name: 'Allbridge',
        description: '',
      }
    },
    async getPositionDefinitions(networkId, address) {
      const allbridgeAddresses = ALLBRIDGE_ADDRESSES_BY_NETWORK_ID[networkId]
      if (!allbridgeAddresses) {
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
  
      return reservesData.flatMap((reserveData, i) => {
        const supplyApy = getApyFromRayApr(reserveData.liquidityRate)
  
        // Include a token if the user has a balance
        // or if no user data is available (when querying all positions)
        const useAToken =
          !userReserveData || userReserveData[i].scaledATokenBalance > 0n
       
        const userIncentives = userIncentivesData?.[i]
        const aTokenRewardsInfo =
          userIncentives?.aTokenIncentivesUserData.userRewardsInformation.filter(
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
                apy: supplyApy,
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
        ].filter((x) => !!x)
      })
    },
    async getAppTokenDefinition({ networkId, address }: TokenDefinition) {
      throw new UnknownAppTokenError({ networkId, address })
    },
  }
  
  export default hook
  