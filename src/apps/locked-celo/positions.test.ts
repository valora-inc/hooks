import hook from './positions'
import { NetworkId } from '../../types/networkId'
import { t } from '../../../test/i18next'

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  createPublicClient: () => ({
    multicall: (...args: any) => mockMulticall(...args),
  }),
}))

const mockMulticall = jest.fn()

describe('getPositionDefinitions', () => {
  it('should return 1 position definition when it has locked CELO', async () => {
    mockMulticall.mockResolvedValue([
      12n * 10n ** 18n, // 12 locked celo
      [[], []], // pending withdrawals
    ])
    const positions = await hook.getPositionDefinitions({
      networkId: NetworkId['celo-mainnet'],
      address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      t,
    })

    expect(positions.length).toBe(1)
  })

  it('should return 0 position definition when it has 0 locked CELO and no pending withdrawals', async () => {
    mockMulticall.mockResolvedValue([
      0n, // 0 locked celo
      [[], []], // pending withdrawals
    ])
    const positions = await hook.getPositionDefinitions({
      networkId: NetworkId['celo-mainnet'],
      address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      t,
    })

    expect(positions.length).toBe(0)
  })
})
