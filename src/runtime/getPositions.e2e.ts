import { getPositions } from './getPositions'
import { NetworkId } from '../types/networkId'

describe('getPositions', () => {
  it.each([NetworkId['celo-mainnet'], NetworkId['ethereum-mainnet']])(
    'should get the address positions successfully for networkId %s',
    async (networkId) => {
      const positions = await getPositions({
        networkId,
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        appIds: [],
      })
      // Simple check to make sure we got some definitions
      expect(positions.length).toBeGreaterThan(0)
    },
  )

  it.each([
    [NetworkId['celo-mainnet'], 'halofi'],
    [NetworkId['ethereum-mainnet'], 'curve'],
  ])(
    'should get the address positions successfully for a specific app for networkId %s',
    async (networkId: NetworkId, appId: string) => {
      const positions = await getPositions({
        networkId,
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        appIds: [appId],
      })
      // Simple check to make sure we got some definitions
      expect(positions.length).toBeGreaterThan(0)
      for (const position of positions) {
        expect(position.appId).toBe(appId)
      }
    },
  )

  it("should throw an error if the app doesn't exist", async () => {
    await expect(
      getPositions({
        networkId: NetworkId['celo-mainnet'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        appIds: ['does-not-exist'],
      }),
    ).rejects.toThrow(
      /No app with id 'does-not-exist' found, available apps: \w+/,
    )
    await expect(
      getPositions({
        networkId: NetworkId['ethereum-mainnet'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        appIds: ['does-not-exist'],
      }),
    ).rejects.toThrow(
      /No app with id 'does-not-exist' found, available apps: \w+/,
    )
  })
})
