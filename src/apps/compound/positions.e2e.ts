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

  it('should get the address definitions successfully for supply & collateral', async () => {
    const positions = await getPositions({
      networkId: NetworkId['op-mainnet'],
      address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      appIds: ['compound'],
      t,
      baseTokensInfo,
    })

    const supplyPosition = positions.find((p) =>
      p.displayProps.title.endsWith(' Supply'),
    )
    expect(supplyPosition?.tokens.length).toBeGreaterThan(0)

    const collateralPosition = positions.find((p) =>
      p.displayProps.title.endsWith(' Collateral'),
    )
    expect(collateralPosition?.tokens.length).toBeGreaterThan(0)
  })

  it('should get the address definitions successfully for debt & collateral', async () => {
    const positions = await getPositions({
      networkId: NetworkId['arbitrum-one'],
      address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      appIds: ['compound'],
      t,
      baseTokensInfo,
    })

    const collateralPosition = positions.find((p) =>
      p.displayProps.title.endsWith(' Collateral'),
    )
    expect(collateralPosition?.tokens.length).toBeGreaterThan(0)

    const debtPosition = positions.find((p) =>
      p.displayProps.title.endsWith(' Debt'),
    )
    expect(debtPosition?.tokens.length).toBeGreaterThan(0)
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
