import hook from './positions'
import { NetworkId } from '../../types/networkId'
import { DisplayProps } from '../../types/positions'
import { t } from '../../../test/i18next'

describe('getPositionDefinitions', () => {
  it('should return the veMENTO position', async () => {
    const positions = await hook.getPositionDefinitions({
      networkId: NetworkId['celo-mainnet'],
      // First address which claimed the airdrop, hopefully will keep the veMENTO position
      address: '0x7a6f024e8d4a015afd417ddcacedcb98c3976224',
      t,
    })
    expect(positions.length).toBeGreaterThan(0)
    const veMentoPosition = positions.find(
      (p) => (p.displayProps as DisplayProps).title === 'veMENTO',
    )
    expect(veMentoPosition).toBeDefined()
  })
})
