import hook from './positions'
import { NetworkId } from '../../types/networkId'
import { getPositions } from '../../runtime/getPositions'
import { t } from '../../../test/i18next'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const positions = await getPositions({
      networkId: NetworkId['op-mainnet'],
      address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      appIds: ['beefy'],
      t,
    })

    expect(
      positions.filter((p) => p.type === 'app-token').length,
    ).toBeGreaterThan(0)
    expect(
      positions.filter((p) => p.type === 'contract-position').length,
    ).toBeGreaterThan(0)
  })

  it('should get no definitions for an address with no blockchain interaction', async () => {
    const positions = await hook.getPositionDefinitions({
      networkId: NetworkId['op-mainnet'],
      address: '0x0000000000000000000000000000000000007e57',
      t,
    })
    expect(positions.length).toBe(0)
  })
})
