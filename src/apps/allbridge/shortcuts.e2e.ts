import hook from './shortcuts'
import { NetworkId } from '../../types/networkId'

describe('getShortcutDefinitions', () => {
  it('should get the definitions successfully', async () => {
    const shortcuts = await hook.getShortcutDefinitions(
      NetworkId['arbitrum-one'],
    )
    expect(shortcuts.length).toBeGreaterThan(0)
    expect(shortcuts[0].id).toBe('deposit')
  })

  describe('deposit.onTrigger', () => {
    it('should return transactions', async () => {
      const shortcuts = await hook.getShortcutDefinitions(
        NetworkId['arbitrum-one'],
      )
      const shortcut = shortcuts.find((shortcut) => shortcut.id === 'deposit')
      expect(shortcut).toBeDefined()

      const transactions = await shortcut!.onTrigger({
        networkId: NetworkId['arbitrum-one'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        token: {
          address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // USDC
          amount: '10',
          decimals: 6,
        },
        positionAddress: '0x724dc807b04555b71ed48a6896b6f41593b8c637',
      })

      expect(transactions.length).toEqual(2)
    })
  })

  describe('withdraw.onTrigger', () => {
    it('should return transactions', async () => {
      const shortcuts = await hook.getShortcutDefinitions(
        NetworkId['arbitrum-one'],
      )
      const shortcut = shortcuts.find((shortcut) => shortcut.id === 'withdraw')
      expect(shortcut).toBeDefined()
      expect(shortcuts[1].id).toBe('withdraw')

      const transactions = await shortcut!.onTrigger({
        networkId: NetworkId['arbitrum-one'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        token: {
          amount: '1',
          decimals: 3,
        },
        positionAddress: '0x724dc807b04555b71ed48a6896b6f41593b8c637',
      })

      expect(transactions.length).toEqual(1)
    })
  })

  describe('claim-rewards.onTrigger', () => {
    it('should return transactions', async () => {
      const shortcuts = await hook.getShortcutDefinitions(
        NetworkId['arbitrum-one'],
      )
      const shortcut = shortcuts.find(
        (shortcut) => shortcut.id === 'claim-rewards',
      )
      expect(shortcut).toBeDefined()
      expect(shortcuts[2].id).toBe('claim-rewards')

      const transactions = await shortcut!.onTrigger({
        networkId: NetworkId['arbitrum-one'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        positionAddress: '0x724dc807b04555b71ed48a6896b6f41593b8c637',
      })

      expect(transactions.length).toEqual(1)
    })
  })
})
