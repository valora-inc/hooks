import { getPositions } from '../../runtime/getPositions'
import { NetworkId } from '../../types/networkId'
import hook from './positions'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const positions = await getPositions(
      NetworkId['celo-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      ['ubeswap'],
    )

    // Uniswap v2 farm definitions
    expect(
      positions.filter(
        (position) => position.displayProps.description === 'Farm',
      ).length,
    ).toBeGreaterThan(0)

    // Uniswap v3 definitions
    expect(
      positions.filter(
        (position) => position.displayProps.description === 'Pool',
      ).length,
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
