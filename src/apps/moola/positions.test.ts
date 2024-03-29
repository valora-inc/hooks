import hook from './positions'
import { NetworkId } from '../../types/networkId'

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  createPublicClient: () => ({
    multicall: (...args: any) => mockMulticall(...args),
  }),
}))

const mockNetworkId = NetworkId['celo-mainnet']
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
      2n * 10n ** 18n, // 2 CELO stable debt
    ])
    const positions = await hook.getPositionDefinitions(
      mockNetworkId,
      mockAddress,
    )

    expect(positions.length).toBe(2)
    expect(positions.map((p) => p.displayProps)).toMatchInlineSnapshot(`
      [
        {
          "description": "Moola variable debt",
          "imageUrl": "https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png",
          "title": "cEUR debt",
        },
        {
          "description": "Moola stable debt",
          "imageUrl": "https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png",
          "title": "CELO debt",
        },
      ]
    `)
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
    const positions = await hook.getPositionDefinitions(
      mockNetworkId,
      mockAddress,
    )

    expect(positions.length).toBe(0)
  })
})
