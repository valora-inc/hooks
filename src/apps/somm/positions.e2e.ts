import { t } from '../../../test/i18next'
import { getConfig } from '../../config'
import { getBaseTokensInfo, getPositions } from '../../runtime/getPositions'
import { NetworkId } from '../../types/networkId'
import { TokensInfo } from '../../types/positions'
import hook from './positions'

describe('getPositionDefinitions', () => {
  let baseTokensInfo: TokensInfo = {}
  beforeAll(async () => {
    baseTokensInfo = await getBaseTokensInfo(getConfig().GET_TOKENS_INFO_URL)
  })

  it('should get the address definitions successfully', async () => {
    const positions = await getPositions({
      networkId: NetworkId['arbitrum-one'],
      address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      appIds: ['somm'],
      t,
      baseTokensInfo,
    })

    expect(
      positions.filter((p) => p.type === 'app-token').length,
    ).toBeGreaterThan(0)
    expect(positions.filter((p) => p.type === 'contract-position').length).toBe(
      0,
    )
  })

  it('should get no definitions for an address with no blockchain interaction', async () => {
    const positions = await hook.getPositionDefinitions({
      networkId: NetworkId['arbitrum-one'],
      address: '0x0000000000000000000000000000000000007e57',
      t,
    })
    expect(positions.length).toBe(0)
  })

  it('should get app token definitions when address is not set', async () => {
    const positions = await hook.getPositionDefinitions({
      networkId: NetworkId['arbitrum-one'],
      t,
    })

    expect(
      positions.filter((p) => p.type === 'app-token-definition').length,
    ).toBeGreaterThan(0)
    expect(
      positions.filter((p) => p.type === 'contract-position-definition').length,
    ).toBe(0)
  })
})
