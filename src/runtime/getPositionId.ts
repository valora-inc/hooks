import { PositionDefinition } from '../types/positions'
import { getTokenId } from './getTokenId'

export function getPositionId(positionDefinition: PositionDefinition): string {
  const tokenId = getTokenId({
    networkId: positionDefinition.networkId,
    address: positionDefinition.address,
  })
  switch (positionDefinition.type) {
    case 'app-token-definition':
      return tokenId
    case 'contract-position-definition':
      return (
        tokenId +
        (positionDefinition.extraId ? `:${positionDefinition.extraId}` : '')
      )
    default:
      const assertNever: never = positionDefinition
      return assertNever
  }
}
