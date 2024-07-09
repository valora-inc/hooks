import { getConfig } from '../../api/config'
import { getPositions } from '../../runtime/getPositions'
import { NetworkId } from '../../types/networkId'
import hook from './positions'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const config = getConfig()

    const positions = await getPositions(
      NetworkId['op-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      ['compound'],
      config.GET_TOKENS_INFO_URL,
    )

    const supplyPosition = positions.find((p) =>
      p.displayProps.title.endsWith(' Supply'),
    )
    expect(supplyPosition?.tokens.length).toBeGreaterThan(0)

    const collateralPosition = positions.find((p) =>
      p.displayProps.title.endsWith(' Collateral'),
    )
    expect(collateralPosition?.tokens.length).toBeGreaterThan(0)

    // TODO: Add debt position (requires access to the test account's private keys).
    // const debtPosition = positions.find((p) =>
    //   p.displayProps.title.endsWith(' Debt'),
    // )
    // expect(debtPosition?.tokens.length).toBeGreaterThan(0)
  })

  it('should get no definitions for an address with no blockchain interaction', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['op-mainnet'],
      '0x0000000000000000000000000000000000007e57',
    )
    expect(positions.length).toBe(0)
  })
})
