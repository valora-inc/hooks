import { ubeswapPlugin } from './plugin'

describe('getPositions', () => {
  it('should get the address positions successfully', async () => {
    const positions = await ubeswapPlugin.getPositions(
      'celo',
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    )
    // Simple check to make sure we got some positions
    expect(positions.length).toBeGreaterThan(0)
  })
})
