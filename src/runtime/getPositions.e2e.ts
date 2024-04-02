import { getPositions } from './getPositions'
import { NetworkId } from '../types/networkId'
import fs from 'fs'
import yaml from 'js-yaml'

describe('getPositions', () => {
  let getTokensInfoUrl: string
  beforeAll(() => {
    // use the same API to get tokens info as we use in production
    const envFileContent = yaml.load(
      fs.readFileSync('src/api/production.yaml', 'utf8'),
    ) as Record<string, string>
    getTokensInfoUrl = envFileContent['GET_TOKENS_INFO_URL']
  })
  it.each([NetworkId['celo-mainnet'], NetworkId['ethereum-mainnet']])(
    'should get the address positions successfully for networkId %s',
    async (networkId) => {
      const positions = await getPositions(
        networkId,
        '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        [],
        getTokensInfoUrl,
      )
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
      const positions = await getPositions(
        networkId,
        '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        [appId],
        getTokensInfoUrl,
      )
      // Simple check to make sure we got some definitions
      expect(positions.length).toBeGreaterThan(0)
      for (const position of positions) {
        expect(position.appId).toBe(appId)
      }
    },
  )

  it("should throw an error if the app doesn't exist", async () => {
    await expect(
      getPositions(
        NetworkId['celo-mainnet'],
        '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        ['does-not-exist'],
        getTokensInfoUrl,
      ),
    ).rejects.toThrow(
      /No app with id 'does-not-exist' found, available apps: \w+/,
    )
    await expect(
      getPositions(
        NetworkId['ethereum-mainnet'],
        '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
        ['does-not-exist'],
        getTokensInfoUrl,
      ),
    ).rejects.toThrow(
      /No app with id 'does-not-exist' found, available apps: \w+/,
    )
  })
})
