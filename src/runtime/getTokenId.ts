import { NetworkId } from '../api/networkId'

export function getTokenId({
  networkId,
  isNative,
  address,
}: {
  networkId: NetworkId
  isNative: boolean
  address?: string
}) {
  return `${networkId}:${isNative ? 'native' : address?.toLowerCase()}`
}
