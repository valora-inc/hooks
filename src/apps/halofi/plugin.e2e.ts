import { halofiPlugin } from './plugin'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const positions = await halofiPlugin.getPositionDefinitions(
      'celo',
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    )
    // Simple check to make sure we got some definitions
    expect(positions.length).toBeGreaterThan(0)
  })
})
