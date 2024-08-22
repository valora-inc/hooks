import hook from './positions'
import { NetworkId } from '../../types/networkId'
import { t } from '../../../test/i18next'

describe.each([NetworkId['celo-mainnet']])(
  'getPositionDefinitions for networkId %s',
  (networkId) => {
    it('should get the address definitions successfully', async () => {
      const positions = await hook.getPositionDefinitions({
        networkId,
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        t,
      })
      // Simple check to make sure we got some definitions
      expect(positions.length).toBeGreaterThan(0)
    })

    it('should get definitions successfully when no address is provided', async () => {
      const positions = await hook.getPositionDefinitions({ networkId, t })
      // Simple check to make sure we got some definitions
      expect(positions.length).toBeGreaterThan(0)
    })
  },
)
