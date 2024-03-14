import { getPositions } from './getPositions'
import { NetworkId } from '../api/networkId'
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
  it('should get the address positions successfully', async () => {
    const positions = await getPositions(
      NetworkId['celo-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      [],
      getTokensInfoUrl,
    )
    // Simple check to make sure we got some definitions
    expect(positions.length).toBeGreaterThan(0)
  })

  it('should get the address positions successfully for a specific app', async () => {
    const positions = await getPositions(
      NetworkId['celo-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
      ['halofi'],
      getTokensInfoUrl,
    )
    // Simple check to make sure we got some definitions
    expect(positions.length).toBeGreaterThan(0)
    for (const position of positions) {
      expect(position.appId).toBe('halofi')
    }
  })

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
  })
})
