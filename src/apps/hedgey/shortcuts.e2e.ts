import hook from './shortcuts'
import { NetworkId } from '../../types/networkId'

const POSITION_ADDRESS = '0x2cde9919e81b20b4b33dd562a48a84b54c48f00c'

describe('getShortcutDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const shortcuts = await hook.getShortcutDefinitions(
      NetworkId['celo-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    )
    expect(shortcuts.length).toBeGreaterThan(0)
  })

  describe('.onTrigger', () => {
    it('should return a Transaction', async () => {
      const shortcuts = await hook.getShortcutDefinitions(
        NetworkId['celo-mainnet'],
        '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      )
      const shortcut = shortcuts[0]

      const { transactions } = await shortcut.onTrigger({
        networkId: NetworkId['celo-mainnet'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        positionAddress: POSITION_ADDRESS,
      })

      expect(transactions.length).toEqual(1)
    })
  })
})
