import hook from './positions'
import { NetworkId } from '../../types/networkId'
import { getConfig } from '../../api/config'
import { getPositions } from '../../runtime/getPositions'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const config = getConfig()

    const positions = await getPositions(
      NetworkId['op-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      ['beefy'],
      config.GET_TOKENS_INFO_URL,
    )

    expect(
      positions.filter((p) => p.type === 'app-token').length,
    ).toBeGreaterThan(0)
    expect(
      positions.filter((p) => p.type === 'contract-position').length,
    ).toBeGreaterThan(0)
  })

  it('should get no definitions for an address with no blockchain interaction', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['op-mainnet'],
      '0x0000000000000000000000000000000000007e57',
    )
    expect(positions.length).toBe(0)
  })
})
