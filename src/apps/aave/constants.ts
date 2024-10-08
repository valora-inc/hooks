import { Address } from '../../types/address'
import { NetworkId } from '../../types/networkId'
import {
  AaveV3Ethereum,
  AaveV3Sepolia,
  AaveV3Arbitrum,
  AaveV3ArbitrumSepolia,
  AaveV3Optimism,
  AaveV3OptimismSepolia,
  AaveV3Polygon,
  AaveV3Base,
} from '@bgd-labs/aave-address-book'

export const AAVE_V3_ADDRESSES_BY_NETWORK_ID: Record<
  NetworkId,
  | {
      poolAddressesProvider: Address
      uiPoolDataProvider: Address
      uiIncentiveDataProvider: Address
      incentivesController: Address
      pool: Address
    }
  | undefined
> = {
  [NetworkId['celo-mainnet']]: undefined,
  [NetworkId['celo-alfajores']]: undefined,
  [NetworkId['ethereum-mainnet']]: {
    poolAddressesProvider: AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
    uiIncentiveDataProvider: AaveV3Ethereum.UI_INCENTIVE_DATA_PROVIDER,
    incentivesController: AaveV3Ethereum.DEFAULT_INCENTIVES_CONTROLLER,
    pool: AaveV3Ethereum.POOL,
  },
  [NetworkId['ethereum-sepolia']]: {
    poolAddressesProvider: AaveV3Sepolia.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3Sepolia.UI_POOL_DATA_PROVIDER,
    uiIncentiveDataProvider: AaveV3Sepolia.UI_INCENTIVE_DATA_PROVIDER,
    incentivesController: AaveV3Sepolia.DEFAULT_INCENTIVES_CONTROLLER,
    pool: AaveV3Sepolia.POOL,
  },
  [NetworkId['arbitrum-one']]: {
    poolAddressesProvider: AaveV3Arbitrum.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: '0xc0179321f0825c3e0F59Fe7Ca4E40557b97797a3', // todo: use AaveV3Arbitrum.UI_POOL_DATA_PROVIDER when it is updated in the address book. Their UI hardcoded this address as well https://github.com/aave/interface/commit/e483c947f4a8b7cd3f44c0e4b50345825f8880e1#diff-ff65d10d56069997014d5d6b327eafd74417201ffa8ce8a219e132427710d8a2R414
    uiIncentiveDataProvider: '0xE92cd6164CE7DC68e740765BC1f2a091B6CBc3e4',
    incentivesController: AaveV3Arbitrum.DEFAULT_INCENTIVES_CONTROLLER,
    pool: AaveV3Arbitrum.POOL,
  },
  [NetworkId['arbitrum-sepolia']]: {
    poolAddressesProvider: AaveV3ArbitrumSepolia.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3ArbitrumSepolia.UI_POOL_DATA_PROVIDER,
    uiIncentiveDataProvider: AaveV3ArbitrumSepolia.UI_INCENTIVE_DATA_PROVIDER,
    incentivesController: AaveV3ArbitrumSepolia.DEFAULT_INCENTIVES_CONTROLLER,
    pool: AaveV3ArbitrumSepolia.POOL,
  },
  [NetworkId['op-mainnet']]: {
    poolAddressesProvider: AaveV3Optimism.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3Optimism.UI_POOL_DATA_PROVIDER,
    uiIncentiveDataProvider: AaveV3Optimism.UI_INCENTIVE_DATA_PROVIDER,
    incentivesController: AaveV3Optimism.DEFAULT_INCENTIVES_CONTROLLER,
    pool: AaveV3Optimism.POOL,
  },
  [NetworkId['op-sepolia']]: {
    poolAddressesProvider: AaveV3OptimismSepolia.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3OptimismSepolia.UI_POOL_DATA_PROVIDER,
    uiIncentiveDataProvider: AaveV3OptimismSepolia.UI_INCENTIVE_DATA_PROVIDER,
    incentivesController: AaveV3OptimismSepolia.DEFAULT_INCENTIVES_CONTROLLER,
    pool: AaveV3OptimismSepolia.POOL,
  },
  [NetworkId['polygon-pos-mainnet']]: {
    poolAddressesProvider: AaveV3Polygon.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3Polygon.UI_POOL_DATA_PROVIDER,
    uiIncentiveDataProvider: AaveV3Polygon.UI_INCENTIVE_DATA_PROVIDER,
    incentivesController: AaveV3Polygon.DEFAULT_INCENTIVES_CONTROLLER,
    pool: AaveV3Polygon.POOL,
  },
  [NetworkId['polygon-pos-amoy']]: undefined,
  [NetworkId['base-mainnet']]: {
    poolAddressesProvider: AaveV3Base.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3Base.UI_POOL_DATA_PROVIDER,
    uiIncentiveDataProvider: AaveV3Base.UI_INCENTIVE_DATA_PROVIDER,
    incentivesController: AaveV3Base.DEFAULT_INCENTIVES_CONTROLLER,
    pool: AaveV3Base.POOL,
  },
  [NetworkId['base-sepolia']]: undefined, // does not have UI_POOL_DATA_PROVIDER
}

enum AaveMarketName {
  proto_mainnet_v3 = 'proto_mainnet_v3',
  proto_arbitrum_v3 = 'proto_arbitrum_v3',
  proto_optimism_v3 = 'proto_optimism_v3',
  proto_polygon_v3 = 'proto_polygon_v3',
  proto_base_v3 = 'proto_base_v3',
}

export const AAVE_LOGO =
  'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/aave.png'

export const AAVE_POOLS_BASE_URL = 'https://app.aave.com/'

export const NETWORK_ID_TO_AAVE_MARKET_NAME: Record<
  NetworkId,
  AaveMarketName | undefined
> = {
  [NetworkId['celo-mainnet']]: undefined,
  [NetworkId['celo-alfajores']]: undefined,
  [NetworkId['ethereum-mainnet']]: AaveMarketName.proto_mainnet_v3,
  [NetworkId['ethereum-sepolia']]: undefined,
  [NetworkId['arbitrum-one']]: AaveMarketName.proto_arbitrum_v3,
  [NetworkId['arbitrum-sepolia']]: undefined,
  [NetworkId['op-mainnet']]: AaveMarketName.proto_optimism_v3,
  [NetworkId['op-sepolia']]: undefined,
  [NetworkId['polygon-pos-mainnet']]: AaveMarketName.proto_polygon_v3,
  [NetworkId['polygon-pos-amoy']]: undefined,
  [NetworkId['base-mainnet']]: AaveMarketName.proto_base_v3,
  [NetworkId['base-sepolia']]: undefined,
}

export const AAVE_CONTRACT_CREATED_AT: Record<string, string> = {
  [`${NetworkId['arbitrum-one']}:0x724dc807b04555b71ed48a6896b6f41593b8c637`]:
    '2023-06-28T10:09:48.000Z',
  [`${NetworkId['arbitrum-sepolia']}:0x460b97bd498e1157530aeb3086301d5225b91216`]:
    '2024-03-08T14:23:53.000Z',
}

export const AAVE_TERMS_URL = 'https://aave.com/terms-of-service'
