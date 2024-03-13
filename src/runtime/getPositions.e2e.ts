import { getPositions } from './getPositions'
import { NetworkId } from '../api/networkId'

describe('getPositions', () => {
  it('should get the address positions successfully', async () => {
    const positions = await getPositions(
      NetworkId['celo-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    )
    // Simple check to make sure we got some definitions
    expect(positions.length).toBeGreaterThan(0)
  })

  it('should get the address positions successfully for a specific app', async () => {
    const positions = await getPositions(
      NetworkId['celo-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      ['halofi'],
    )
    // Simple check to make sure we got some definitions
    expect(positions.length).toBeGreaterThan(0)
    for (const position of positions) {
      expect(position.appId).toBe('halofi')
    }
  })

  it("should throw an error if the app doesn't exist", async () => {
    await expect(
      getPositions(
        NetworkId['celo-mainnet'],
        '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        ['does-not-exist'],
      ),
    ).rejects.toThrow(
      /No app with id 'does-not-exist' found, available apps: \w+/,
    )
  })
})
