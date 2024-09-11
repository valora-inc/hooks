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
        tokenAddress: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // USDC
        tokenDecimals: 6,
        positionAddress: '0x724dc807b04555b71ed48a6896b6f41593b8c637',
        tokens: [
          {
            tokenId: `${NetworkId['arbitrum-one']}:0xaf88d065e77c8cc2239327c5edb3a432268e5831`,
            amount: '10',
          },
        ],
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
        tokens: [
          {
            tokenId: `${NetworkId['arbitrum-one']}:0x724dc807b04555b71ed48a6896b6f41593b8c637`,
            amount: '1',
          },
        ],
        positionAddress: '0x724dc807b04555b71ed48a6896b6f41593b8c637',
        tokenDecimals: 3,
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

  describe('swap-deposit.onTrigger', () => {
    it('should return transactions', async () => {
      const shortcuts = await hook.getShortcutDefinitions(
        NetworkId['celo-mainnet'],
      )
      const shortcut = shortcuts.find(
        (shortcut) => shortcut.id === 'swap-deposit',
      )
      expect(shortcut).toBeDefined()

      const transactions = await shortcut!.onTrigger({
        networkId: NetworkId['celo-mainnet'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        tokenAddress: '0x617f3112bf5397d0467d315cc709ef968d9ba546', // USDT
        positionAddress: '0xfb2c7c10e731ebe96dabdf4a96d656bfe8e2b5af',
        swapFromToken: {
          tokenId: 'celo-mainnet:0x765de816845861e75a25fca122bb6898b8b1282a', // CUSD
          amount: '1',
          decimals: 18,
          address: '0x765de816845861e75a25fca122bb6898b8b1282a',
          isNative: false,
        },
      })

      expect(transactions.length).toEqual(2)
    })
  })
})
