import hook from './positions'
import { NetworkId } from '../../api/networkId'

describe('getPositionDefinitions', () => {
  it.each([NetworkId['ethereum-mainnet'], NetworkId['celo-mainnet']])(
    'should get the address definitions successfully for networkId %s',
    async (networkId) => {
      const positions = await hook.getPositionDefinitions(
        networkId,
        '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      )
      // Simple check to make sure we got some definitions
      expect(positions.length).toBeGreaterThan(0)
    },
  )
})
