import hook from './positions'
import { NetworkId } from '../../types/networkId'
import { t } from '../../../test/i18next'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const positions = await hook.getPositionDefinitions({
      networkId: NetworkId['celo-mainnet'],
      address: '0xb847ea9e017779bf63947ad72cd6bf06407cd2e1',
      t,
    })
    // Simple check to make sure we got some definitions
    expect(positions.length).toBeGreaterThan(0)
  })
})
