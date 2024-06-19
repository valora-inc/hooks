import hook from './positions'
import { NetworkId } from '../../types/networkId'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['op-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    )

    expect(positions.length).toBeGreaterThan(0)
  })

  it('should get no definitions for an address with no blockchain interaction', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['op-mainnet'],
      '0x0000000000000000000000000000000000007e57',
    )
    expect(positions.length).toBe(0)
  })
})
