import hook from './positions'
import { NetworkId } from '../../types/networkId'

describe.each([NetworkId['arbitrum-one'], NetworkId['ethereum-mainnet']])(
  'getPositionDefinitions for networkId %s',
  (networkId) => {
    it('should get the address definitions successfully', async () => {
      if (networkId === NetworkId['ethereum-mainnet']) {
        // We don't yet have a position with our test wallet
        // TODO: add one
        return
      }
      const positions = await hook.getPositionDefinitions(
        networkId,
        '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      )
      // Simple check to make sure we got some definitions
      expect(positions.length).toBeGreaterThan(0)
    })

    it('should get definitions successfully when no address is provided', async () => {
      const positions = await hook.getPositionDefinitions(networkId)
      // Simple check to make sure we got some definitions
      expect(positions.length).toBeGreaterThan(0)
    })
  },
)
