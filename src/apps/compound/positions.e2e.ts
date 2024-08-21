import { getPositions } from '../../runtime/getPositions'
import { NetworkId } from '../../types/networkId'
import hook from './positions'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully for supply & collateral', async () => {
    const positions = await getPositions({
      networkId: NetworkId['op-mainnet'],
      address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      appIds: ['compound'],
    })

    const supplyPosition = positions.find((p) =>
      p.displayProps.title.endsWith(' Supply'),
    )
    expect(supplyPosition?.tokens.length).toBeGreaterThan(0)

    const collateralPosition = positions.find((p) =>
      p.displayProps.title.endsWith(' Collateral'),
    )
    expect(collateralPosition?.tokens.length).toBeGreaterThan(0)
  })

  it('should get the address definitions successfully for debt & collateral', async () => {
    const positions = await getPositions({
      networkId: NetworkId['arbitrum-one'],
      address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      appIds: ['compound'],
    })

    const collateralPosition = positions.find((p) =>
      p.displayProps.title.endsWith(' Collateral'),
    )
    expect(collateralPosition?.tokens.length).toBeGreaterThan(0)

    const debtPosition = positions.find((p) =>
      p.displayProps.title.endsWith(' Debt'),
    )
    expect(debtPosition?.tokens.length).toBeGreaterThan(0)
  })

  it('should get no definitions for an address with no blockchain interaction', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['op-mainnet'],
      '0x0000000000000000000000000000000000007e57',
    )
    expect(positions.length).toBe(0)
  })
})
