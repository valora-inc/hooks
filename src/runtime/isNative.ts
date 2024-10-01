import { NetworkId } from '../types/networkId'

const ETHER_HEX_IDENTIFIER = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' // curve and some other dapps use this address as an identifier for the native asset

export const networkIdToNativeAssetAddress: Record<NetworkId, string> = {
  [NetworkId['arbitrum-one']]: ETHER_HEX_IDENTIFIER,
  [NetworkId['arbitrum-sepolia']]: ETHER_HEX_IDENTIFIER,
  [NetworkId['op-mainnet']]: ETHER_HEX_IDENTIFIER,
  [NetworkId['op-sepolia']]: ETHER_HEX_IDENTIFIER,
  [NetworkId['ethereum-mainnet']]: ETHER_HEX_IDENTIFIER,
  [NetworkId['ethereum-sepolia']]: ETHER_HEX_IDENTIFIER,
  [NetworkId['celo-mainnet']]: '0x471ece3750da237f93b8e339c536989b8978a438',
  [NetworkId['celo-alfajores']]: '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
  [NetworkId['polygon-pos-mainnet']]: ETHER_HEX_IDENTIFIER,
  [NetworkId['polygon-pos-amoy']]: ETHER_HEX_IDENTIFIER,
  [NetworkId['base-mainnet']]: ETHER_HEX_IDENTIFIER,
  [NetworkId['base-sepolia']]: ETHER_HEX_IDENTIFIER,
}

export function isNative({
  networkId,
  address,
}: {
  networkId: NetworkId
  address: string | undefined
}): boolean {
  if (!address) {
    return true
  }
  return (
    address.toLowerCase() ===
    networkIdToNativeAssetAddress[networkId].toLowerCase()
  )
}
