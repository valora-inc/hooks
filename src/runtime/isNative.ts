import { NetworkId } from '../api/networkId'

const ETHER_HEX_IDENTIFIER = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' // curve and some other dapps use this address as an identifier for the native asset

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
  if (networkId === NetworkId['celo-mainnet']) {
    return (
      address.toLowerCase() === '0x471ece3750da237f93b8e339c536989b8978a438'
    )
  }
  if (networkId === NetworkId['celo-alfajores']) {
    return (
      address.toLowerCase() === '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9'
    )
  }
  return address.toLowerCase() === ETHER_HEX_IDENTIFIER
}
