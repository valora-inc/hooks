import hook from './shortcuts'
import { NetworkId } from '../../types/networkId'
import { ShortcutDefinition } from '../../types/shortcuts'

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

      const { transactions } = await shortcut!.onTrigger({
        networkId: NetworkId['arbitrum-one'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
        tokenDecimals: 6,
        positionAddress: '0xb9A27ba529634017b12e3cbbbFFb6dB7908a8C8B',
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

      const { transactions } = await shortcut!.onTrigger({
        networkId: NetworkId['arbitrum-one'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        tokens: [
          {
            tokenId: `${NetworkId['arbitrum-one']}:0xb9A27ba529634017b12e3cbbbFFb6dB7908a8C8B`,
            amount: '1',
          },
        ],
        positionAddress: '0xb9A27ba529634017b12e3cbbbFFb6dB7908a8C8B',
        tokenDecimals: 3,
      })

      expect(transactions.length).toEqual(1)
    })
  })

  describe('swap-deposit.onTrigger', () => {
    it('should return transactions', async () => {
      const shortcuts = await hook.getShortcutDefinitions(
        NetworkId['arbitrum-one'],
      )
      const shortcut = shortcuts.find(
        (shortcut) => shortcut.id === 'swap-deposit',
      )
      expect(shortcut).toBeDefined()
      expect(shortcut!.category).toEqual('swap-deposit')

      const { transactions, dataProps } = await (
        shortcut as ShortcutDefinition<'swap-deposit', any>
      ).onTrigger({
        networkId: NetworkId['arbitrum-one'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        positionAddress: '0xb9A27ba529634017b12e3cbbbFFb6dB7908a8C8B',
        swapFromToken: {
          decimals: 18,
          tokenId: `${NetworkId['arbitrum-one']}:native`, // ETH
          amount: '0.0001',
          isNative: true,
        },
        tokenAddress: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // USDC
      })

      expect(transactions.length).toEqual(1)
      expect(dataProps).toBeDefined()
      expect(dataProps.swapTransaction).toBeDefined()
    })
  })
})
