import {
  PositionsHook,
  AppTokenPositionDefinition,
  UnknownAppTokenError,
  TokenDefinition,
} from '../../types/positions'
import { Address } from 'viem'
import { DecimalNumber } from '../../types/numbers'
import BigNumber from 'bignumber.js'
import { NetworkId } from '../../types/networkId'
import { getClient } from '../../runtime/client'
import { uiPoolDataProviderV3Abi } from './abis/ui-pool-data-provider-v3'

// See https://github.com/bgd-labs/aave-address-book/tree/fbb590953db44d62a756d4639cb77ea58afb299c/src/ts
// and https://docs.aave.com/developers/deployed-contracts/v3-mainnet
const AAVE_V3_ADDRESSES_BY_NETWORK_ID: Record<
  NetworkId,
  | {
      poolAddressesProvider: Address
      uiPoolDataProvider: Address
    }
  | undefined
> = {
  [NetworkId['celo-mainnet']]: undefined,
  [NetworkId['celo-alfajores']]: undefined,
  [NetworkId['ethereum-mainnet']]: {
    poolAddressesProvider: '0x2f39d218133afab8f2b819b1066c7e434ad94e9e',
    uiPoolDataProvider: '0x91c0ea31b49b69ea18607702c5d9ac360bf3de7d',
  },
  [NetworkId['ethereum-sepolia']]: {
    poolAddressesProvider: '0x012bac54348c0e635dcac9d5fb99f06f24136c9a',
    uiPoolDataProvider: '0x69529987fa4a075d0c00b0128fa848dc9ebbe9ce',
  },
  [NetworkId['arbitrum-one']]: {
    poolAddressesProvider: '0xa97684ead0e402dc232d5a977953df7ecbab3cdb',
    uiPoolDataProvider: '0x145de30c929a065582da84cf96f88460db9745a7',
  },
  [NetworkId['arbitrum-sepolia']]: {
    poolAddressesProvider: '0xb25a5d144626a0d488e52ae717a051a2e9997076',
    uiPoolDataProvider: '0x97cf44bf6a9a3d2b4f32b05c480dbedc018f72a9',
  },
  [NetworkId['op-mainnet']]: {
    poolAddressesProvider: '0xa97684ead0e402dc232d5a977953df7ecbab3cdb',
    uiPoolDataProvider: '0xbd83ddbe37fc91923d59c8c1e0bde0cccca332d5',
  },
  [NetworkId['op-sepolia']]: {
    poolAddressesProvider: '0x36616cf17557639614c1cddb356b1b83fc0b2132',
    uiPoolDataProvider: '0x86e2938dae289763d4e09a7e42c5ccca62cf9809',
  },
}

const AAVE_LOGO =
  'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/aave.png'

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

    const userReserveData = address
      ? await client.readContract({
          address: aaveAddresses.uiPoolDataProvider,
          abi: uiPoolDataProviderV3Abi,
          functionName: 'getUserReservesData',
          args: [aaveAddresses.poolAddressesProvider, address as Address],
        })
      : undefined

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

      return [
        // AToken
        useAToken &&
          ({
            type: 'app-token-definition',
            networkId,
            address: reserveData.aTokenAddress.toLowerCase(),
            tokens: [{ address: reserveData.underlyingAsset, networkId }],
            availableShortcutIds: ['deposit', 'withdraw'],
            displayProps: {
              title: reserveData.symbol,
              description: `Supplied (APY: ${supplyApy.toFixed(2)}%)`,
              imageUrl: AAVE_LOGO,
            },
            pricePerShare: [new BigNumber(1) as DecimalNumber],
          } satisfies AppTokenPositionDefinition),
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
      ].filter((x) => !!x)
    })
  },
  async getAppTokenDefinition({ networkId, address }: TokenDefinition) {
    throw new UnknownAppTokenError({ networkId, address })
  },
}

export default hook
