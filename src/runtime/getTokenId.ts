import { NetworkId } from '../api/networkId'
import { isNative as tokenIsNative } from './isNative'

/**
 * Get a unique identifier for a crypto asset
 *
 * Standard across Valora repos
 *
 * @param networkId
 * @param isNative: should be defined if the token is known to be native, like CELO or ETH on their respective chains,
 *  or not, like the address of a generic ERC-20 or other kind of smart contract
 * @param address
 */
export function getTokenId({
  networkId,
  isNative,
  address,
}: {
  networkId: NetworkId
  isNative?: boolean
  address?: string
}) {
  if (isNative === undefined) {
    isNative = tokenIsNative({ networkId, address })
  }
  return `${networkId}:${isNative ? 'native' : address?.toLowerCase()}`
}
