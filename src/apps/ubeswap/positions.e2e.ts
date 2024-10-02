import { t } from '../../../test/i18next'
import { getPositions } from '../../runtime/getPositions'
import { NetworkId } from '../../types/networkId'
import hook from './positions'

// eslint-disable-next-line jest/no-disabled-tests -- disabled temporarily because the api is returning errors
describe.skip('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const positions = await getPositions({
      networkId: NetworkId['celo-mainnet'],
      address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      appIds: ['ubeswap'],
      t,
      baseTokensInfo: {},
    })

    // Uniswap v2 farm definitions
    expect(
      positions.filter(
        (position) => position.displayProps.description === 'Farm',
      ).length,
    ).toBeGreaterThan(0)

    // Uniswap v3 definitions
    expect(
      positions.filter(
        (position) => position.displayProps.description === 'Pool',
      ).length,
    ).toBeGreaterThan(0)
  })

  it('should get no definitions for an address with no blockchain interaction', async () => {
    const positions = await hook.getPositionDefinitions({
      networkId: NetworkId['celo-mainnet'],
      address: '0x0000000000000000000000000000000000007e57',
      t,
    })
    expect(positions.length).toBe(0)
  })
})
