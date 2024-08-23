import hook from './positions'
import { NetworkId } from '../../types/networkId'
import { t } from '../../../test/i18next'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const positions = await hook.getPositionDefinitions({
      networkId: NetworkId['celo-mainnet'],
      address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      t,
    })
    // Simple check to make sure we got some definitions
    expect(positions.length).toBeGreaterThan(0)
  })
})
