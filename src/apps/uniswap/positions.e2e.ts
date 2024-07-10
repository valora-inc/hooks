import hook from './positions'
import { NetworkId } from '../../types/networkId'
import { getPositions } from '../../runtime/getPositions'
import { getConfig } from '../../api/config'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const config = getConfig()

    const positions = await getPositions(
      NetworkId['celo-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      ['uniswap'],
      config.GET_TOKENS_INFO_URL,
    )

    expect(positions.length).toBeGreaterThan(0)
  })

  it('should get no definitions for an address with no blockchain interaction', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['celo-mainnet'],
      '0x0000000000000000000000000000000000007e57',
    )
    expect(positions.length).toBe(0)
  })
})
