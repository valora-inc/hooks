import { getBaseTokensInfo, getPositions } from './getPositions'
import { NetworkId } from '../types/networkId'
import { t } from '../../test/i18next'
import { TokensInfo } from '../types/positions'
import { getConfig } from '../config'

describe('getPositions', () => {
  let baseTokensInfo: TokensInfo = {}
  beforeAll(async () => {
    baseTokensInfo = await getBaseTokensInfo(getConfig().GET_TOKENS_INFO_URL)
  })

  it.each([NetworkId['celo-mainnet'], NetworkId['ethereum-mainnet']])(
    'should get the address positions successfully for networkId %s',
    async (networkId) => {
      const positions = await getPositions({
        networkId,
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        appIds: [],
        t,
        baseTokensInfo,
      })
      // Simple check to make sure we got some definitions
      expect(positions.length).toBeGreaterThan(0)
    },
  )

  it.each([
    [NetworkId['celo-mainnet'], 'halofi'],
    [NetworkId['ethereum-mainnet'], 'curve'],
  ])(
    'should get the address positions successfully for a specific app for networkId %s',
    async (networkId: NetworkId, appId: string) => {
      const positions = await getPositions({
        networkId,
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        appIds: [appId],
        t,
        baseTokensInfo,
      })
      // Simple check to make sure we got some definitions
      expect(positions.length).toBeGreaterThan(0)
      for (const position of positions) {
        expect(position.appId).toBe(appId)
      }
    },
  )

  it("should throw an error if the app doesn't exist", async () => {
    await expect(
      getPositions({
        networkId: NetworkId['celo-mainnet'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        appIds: ['does-not-exist'],
        t,
        baseTokensInfo,
      }),
    ).rejects.toThrow(
      /No app with id 'does-not-exist' found, available apps: \w+/,
    )
    await expect(
      getPositions({
        networkId: NetworkId['ethereum-mainnet'],
        address: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        appIds: ['does-not-exist'],
        t,
        baseTokensInfo,
      }),
    ).rejects.toThrow(
      /No app with id 'does-not-exist' found, available apps: \w+/,
    )
  })
})
