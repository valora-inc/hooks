import hook from './positions'
import { NetworkId } from '../../types/networkId'
import { t } from '../../../test/i18next'

describe('getPositionDefinitions', () => {
  it('should return the staked WCT position', async () => {
    const positions = await hook.getPositionDefinitions({
      networkId: NetworkId['op-mainnet'],
      address: '0xccc9576f841de93cd32bee7b98fe8b9bd3070e3d',
      t,
    })
    expect(positions.length).toBeGreaterThan(1)
  })
})
