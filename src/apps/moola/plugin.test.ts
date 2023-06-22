import plugin from './plugin'

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  createPublicClient: () => ({
    multicall: (...args: any) => mockMulticall(...args),
  }),
}))

const mockNetwork = 'celo'
const mockAddress = '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d'

const mockMulticall = jest.fn()

describe('getPositionDefinitions', () => {
  it('should return debt token positions when user has debt', async () => {
    mockMulticall.mockResolvedValue([
      10n * 10n ** 18n, // 10 cEUR variable debt
      0n, // 0 cUSD variable debt
      0n, // 0 cREAL variable debt
      0n, // 0 CELO variable debt
      0n, // 0 cEUR stable debt
      0n, // 0 cUSD stable debt
      0n, // 0 cREAL stable debt
      0n, // 0 CELO stable debt
    ])
    const positions = await plugin.getPositionDefinitions(
      mockNetwork,
      mockAddress,
    )

    expect(positions.length).toBe(1)
  })

  it('should return no debt token positions when user has no debt', async () => {
    mockMulticall.mockResolvedValue([
      0n, // 0 cEUR variable debt
      0n, // 0 cUSD variable debt
      0n, // 0 cREAL variable debt
      0n, // 0 CELO variable debt
      0n, // 0 cEUR stable debt
      0n, // 0 cUSD stable debt
      0n, // 0 cREAL stable debt
      0n, // 0 CELO stable debt
    ])
    const positions = await plugin.getPositionDefinitions(
      mockNetwork,
      mockAddress,
    )

    expect(positions.length).toBe(0)
  })
})
