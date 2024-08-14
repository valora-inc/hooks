import { Address } from '../../types/address'
import { NetworkId } from '../../types/networkId'

// See https://github.com/bgd-labs/aave-address-book/tree/fbb590953db44d62a756d4639cb77ea58afb299c/src/ts
// and https://docs.aave.com/developers/deployed-contracts/v3-mainnet
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
    poolAddressesProvider: '0x2f39d218133afab8f2b819b1066c7e434ad94e9e',
    uiPoolDataProvider: '0x5c5228ac8bc1528482514af3e27e692495148717',
    uiIncentiveDataProvider: '0x162a7ac02f547ad796ca549f757e2b8d1d9b10a6',
    incentivesController: '0x8164cc65827dcfe994ab23944cbc90e0aa80bfcb',
    pool: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2',
  },
  [NetworkId['ethereum-sepolia']]: {
    poolAddressesProvider: '0x012bac54348c0e635dcac9d5fb99f06f24136c9a',
    uiPoolDataProvider: '0x69529987fa4a075d0c00b0128fa848dc9ebbe9ce',
    uiIncentiveDataProvider: '0xba25de9a7dc623b30799f33b770d31b44c2c3b77',
    incentivesController: '0x4da5c4da71c5a167171cc839487536d86e083483',
    pool: '0x6ae43d3271ff6888e7fc43fd7321a503ff738951',
  },
  [NetworkId['arbitrum-one']]: {
    poolAddressesProvider: '0xa97684ead0e402dc232d5a977953df7ecbab3cdb',
    uiPoolDataProvider: '0x145de30c929a065582da84cf96f88460db9745a7',
    uiIncentiveDataProvider: '0xda67af3403555ce0ae3ffc22fdb7354458277358',
    incentivesController: '0x929ec64c34a17401f460460d4b9390518e5b473e',
    pool: '0x794a61358d6845594f94dc1db02a252b5b4814ad',
  },
  [NetworkId['arbitrum-sepolia']]: {
    poolAddressesProvider: '0xb25a5d144626a0d488e52ae717a051a2e9997076',
    uiPoolDataProvider: '0x97cf44bf6a9a3d2b4f32b05c480dbedc018f72a9',
    uiIncentiveDataProvider: '0xb90fa850a4af6d30fea8b41989eaaecdca8fd414',
    incentivesController: '0x3a203b14cf8749a1e3b7314c6c49004b77ee667a',
    pool: '0xbfc91d59fdaa134a4ed45f7b584caf96d7792eff',
  },
  [NetworkId['op-mainnet']]: {
    poolAddressesProvider: '0xa97684ead0e402dc232d5a977953df7ecbab3cdb',
    uiPoolDataProvider: '0xbd83ddbe37fc91923d59c8c1e0bde0cccca332d5',
    uiIncentiveDataProvider: '0x6f143fe2f7b02424ad3cad1593d6f36c0aab69d7',
    incentivesController: '0x929ec64c34a17401f460460d4b9390518e5b473e',
    pool: '0x794a61358d6845594f94dc1db02a252b5b4814ad',
  },
  [NetworkId['op-sepolia']]: {
    poolAddressesProvider: '0x36616cf17557639614c1cddb356b1b83fc0b2132',
    uiPoolDataProvider: '0x86e2938dae289763d4e09a7e42c5ccca62cf9809',
    uiIncentiveDataProvider: '0xcfdada7dcd2e785cf706badbc2b8af5084d595e9',
    incentivesController: '0xad4f91d26254b6b0c6346b390dda2991fde2f20d',
    pool: '0xb50201558b00496a145fe76f7424749556e326d8',
  },
  [NetworkId['polygon-pos-mainnet']]: {
    poolAddressesProvider: '0xa97684ead0e402dc232d5a977953df7ecbab3cdb',
    uiPoolDataProvider: '0xc69728f11e9e6127733751c8410432913123acf1',
    uiIncentiveDataProvider: '0x874313a46e4957d29faac43bf5eb2b144894f557',
    incentivesController: '0x929ec64c34a17401f460460d4b9390518e5b473e',
    pool: '0x794a61358d6845594f94dc1db02a252b5b4814ad',
  },
  [NetworkId['polygon-pos-amoy']]: undefined,
  [NetworkId['base-mainnet']]: {
    poolAddressesProvider: '0xe20fcbdbffc4dd138ce8b2e6fbb6cb49777ad64d',
    uiPoolDataProvider: '0x174446a6741300cd2e7c1b1a636fee99c8f83502',
    uiIncentiveDataProvider: '0xedd3b4737c1a0011626631a977b91cf3e944982d',
    incentivesController: '0xf9cc4f0d883f1a1eb2c253bdb46c254ca51e1f44',
    pool: '0xa238dd80c259a72e81d7e4664a9801593f98d1c5',
  },
  [NetworkId['base-sepolia']]: {
    poolAddressesProvider: '0xd449fed49d9c443688d6816fe6872f21402e41de',
    uiPoolDataProvider: '0x884702e4b1d0a2900369e83d5765d537f469cac9',
    uiIncentiveDataProvider: '0x52cb5cdf732889be3fd5d5e3a5d589446e060c0d',
    incentivesController: '0x659fbb419151b8e752c4589dffca3403865b7232',
    pool: '0x07ea79f68b2b3df564d0a34f8e19d9b1e339814b',
  },
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
