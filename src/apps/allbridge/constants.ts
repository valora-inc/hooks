import { NetworkId } from '../../types/networkId'

export enum AllbridgeChain {
  CEL = 'CEL',
  ETH = 'ETH',
  ARB = 'ARB',
  OPT = 'OPT',
  POL = 'POL',
  BAS = 'BAS',
}

export const ALLBRIDGE_LOGO =
  'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/allbridgecore.png'

export const ALLBRIDGE_POOLS_BASE_URL = 'https://core.allbridge.io/pools'

export const NETWORK_ID_TO_ALLBRIDGE_CHAIN: Record<
  NetworkId,
  AllbridgeChain | undefined
> = {
  [NetworkId['celo-mainnet']]: AllbridgeChain.CEL,
  [NetworkId['celo-alfajores']]: undefined,
  [NetworkId['ethereum-mainnet']]: AllbridgeChain.ETH,
  [NetworkId['ethereum-sepolia']]: undefined,
  [NetworkId['arbitrum-one']]: AllbridgeChain.ARB,
  [NetworkId['arbitrum-sepolia']]: undefined,
  [NetworkId['op-mainnet']]: AllbridgeChain.OPT,
  [NetworkId['op-sepolia']]: undefined,
  [NetworkId['polygon-pos-mainnet']]: AllbridgeChain.POL,
  [NetworkId['polygon-pos-amoy']]: undefined,
  [NetworkId['base-mainnet']]: AllbridgeChain.BAS,
  [NetworkId['base-sepolia']]: undefined,
}

export const ALLBRIGE_CONTRACT_CREATED_AT: Record<string, string> = {
  [`${NetworkId['celo-mainnet']}:0xfb2c7c10e731ebe96dabdf4a96d656bfe8e2b5af`]:
    '2024-05-08T09:09:55.000Z',
}
