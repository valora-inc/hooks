import hook from './positions'
import { NetworkId } from '../../types/networkId'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['celo-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    )
    // Simple checks to make sure we got some definitions

    // ube v2 pool definitions
    expect(
      positions.filter((p) => p.type === 'app-token-definition').length,
    ).toBeGreaterThan(0)

    // ube v2 farm definitions and ube v3 pools are both contract definitions. We could
    // call displayProps to distinguish v2 farms from v3 pools for better coverage.
    expect(
      positions.filter((p) => p.type === 'contract-position-definition').length,
    ).toBeGreaterThan(0)
  })

  it('should get no definitions for an address with no blockchain interaction', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['celo-mainnet'],
      '0x0000000000000000000000000000000000007e57',
    )
    expect(positions.length).toBe(0)
  })
})
