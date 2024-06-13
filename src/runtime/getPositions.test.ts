import { getPositions } from './getPositions'
import * as hooks from './getHooks'
import {
  AppTokenPosition,
  AppTokenPositionDefinition,
  ContractPositionDefinition,
  PositionsHook,
  UnknownAppTokenError,
} from '../types/positions'
import { SerializedDecimalNumber, toDecimalNumber } from '../types/numbers'
import { logger } from '../log'
import { NetworkId } from '../types/networkId'
import got from 'got'
import * as mockTokensInfo from './mockTokensInfo.json'

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  createPublicClient: () => ({
    multicall: (...args: any) => mockMulticall(...args),
  }),
}))

const mockMulticall = jest.fn()

const getHooksSpy = jest.spyOn(hooks, 'getHooks')
const getSpy = jest.spyOn(got, 'get')

const lockedCeloTestHook: PositionsHook = {
  getInfo() {
    return {
      id: 'locked-celo-test',
      name: 'Locked CELO Test',
      description: '',
    }
  },
  async getPositionDefinitions(networkId, _address) {
    const position: ContractPositionDefinition = {
      type: 'contract-position-definition',
      networkId,
      address: '0x6cc083aed9e3ebe302a6336dbc7c921c9f03349e',
      tokens: [
        { address: '0x471ece3750da237f93b8e339c536989b8978a438', networkId },
      ],
      displayProps: {
        title: 'Locked CELO Test',
        description: '',
        imageUrl:
          'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/CELO.png',
      },
      balances: async () => {
        return [toDecimalNumber(10n, 18)]
      },
    }

    return [position]
  },
}

const failingTestHook: PositionsHook = {
  getInfo() {
    return {
      id: 'failing-hook',
      name: 'Failing Hook',
      description: '',
    }
  },
  async getPositionDefinitions(_network, _address) {
    throw new Error('This hook fails')
  },
}

const loggerErrorSpy = jest.spyOn(logger, 'error')

beforeEach(() => {
  jest.clearAllMocks()
})

describe(getPositions, () => {
  it('should ignore positions for hooks that throw errors', async () => {
    getHooksSpy.mockResolvedValue({
      'locked-celo-test': lockedCeloTestHook,
      'failing-hook': failingTestHook,
    })
    getSpy.mockReturnValue({
      json: jest.fn().mockResolvedValue(mockTokensInfo),
    } as any)
    const positions = await getPositions(
      NetworkId['celo-mainnet'],
      '0x0000000000000000000000000000000000007e57',
      [],
      'mock-token-info-url',
    )
    expect(positions.length).toBe(1)
    expect(positions.map((p) => p.appId)).toEqual(['locked-celo-test'])
    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      { err: new Error('This hook fails') },
      'Failed to get position definitions for failing-hook',
    )
  })

  it('should throw an error when getAppTokenDefinition is needed but not implemented', async () => {
    const testHook: PositionsHook = {
      getInfo() {
        return {
          id: 'test-hook',
          name: 'Test Hook',
          description: '',
        }
      },
      async getPositionDefinitions(networkId, _address) {
        const position: AppTokenPositionDefinition = {
          type: 'app-token-definition',
          networkId,
          address: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
          tokens: [
            // Intermediary token that would need to be resolved
            {
              address: '0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e',
              networkId,
            },
          ],
          displayProps: {
            title: 'Test Hook',
            description: '',
            imageUrl:
              'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/CELO.png',
          },
          pricePerShare: async () => {
            return [toDecimalNumber(5n, 1)]
          },
        }

        return [position]
      },
    }

    mockMulticall.mockResolvedValue([
      'ULP', // Symbol for 0xda7f463c27ec862cfbf2369f3f74c364d050d93f
      18, // Decimals
    ])
    getHooksSpy.mockResolvedValue({
      'test-hook': testHook,
    })
    await expect(
      getPositions(
        NetworkId['celo-mainnet'],
        '0x0000000000000000000000000000000000007e57',
        [],
        'mock-get-tokens-info-url',
      ),
    ).rejects.toThrow(
      "Positions hook for app 'test-hook' does not implement 'getAppTokenDefinition'. Please implement it to resolve the intermediary app token definition for 0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e (celo-mainnet)",
    )
  })

  it("should use the fallbackPriceUsd if the token can't be found", async () => {
    const testHook: PositionsHook = {
      getInfo() {
        return {
          id: 'beefy-price-escape',
          name: 'Beefy Price Escape',
          description: 'Beefy with price escape hatch for underlying tokens',
        }
      },

      async getPositionDefinitions(networkId: NetworkId, _address: string) {
        if (networkId !== NetworkId['op-mainnet']) {
          return []
        }

        return [
          {
            type: 'app-token-definition',
            networkId,
            // Beefy crvUSD/​WBTC/​WETH Vault
            // https://app.beefy.com/vault/curve-op-tricrypto-crvusd
            address: '0xf82160Bad52C235102174aE5E7f36d5099DEEad3',
            tokens: [
              {
                // Underlying Curve LP token
                address: '0x4456d13Fc6736e8e8330394c0C622103E06ea419',
                networkId,
                // Fallback until we can properly decompose the token into base tokens
                fallbackPriceUsd: '0.5' as SerializedDecimalNumber,
              },
            ],
            // Meaning that 1 share of the vault is worth 2 underlying token
            pricePerShare: [toDecimalNumber(2n, 0)],
            displayProps: {
              title: 'Beefy crvUSD/​WBTC/​WETH Vault',
              description: 'Vault',
              imageUrl: '',
            },
          },
        ]
      },

      async getAppTokenDefinition(tokenDefinition) {
        throw new UnknownAppTokenError(tokenDefinition)
      },
    }

    mockMulticall
      .mockResolvedValueOnce([
        '3c-crvUSD', // Symbol for 0x4456d13Fc6736e8e8330394c0C622103E06ea419
        18, // Decimals
      ])
      .mockResolvedValueOnce([
        'mooCurveTriCrypto-crvUSD', // Symbol for 0xf82160Bad52C235102174aE5E7f36d5099DEEad3
        18, // Decimals
      ])
      .mockResolvedValueOnce([
        30n * 10n ** 18n, // balanceOf 0xf82160Bad52C235102174aE5E7f36d5099DEEad3
        1000n * 10n ** 18n, // totalSupply
      ])
    getHooksSpy.mockResolvedValue({
      'beefy-price-escape': testHook,
    })
    getSpy.mockReturnValue({
      json: jest.fn().mockResolvedValue(mockTokensInfo),
    } as any)
    const positions = await getPositions(
      NetworkId['op-mainnet'],
      '0x0000000000000000000000000000000000007e57',
      [],
      'mock-token-info-url',
    )
    expect(positions.length).toBe(1)
    const beefyPosition = positions[0] as AppTokenPosition
    expect(beefyPosition.appId).toBe('beefy-price-escape')
    expect(beefyPosition.tokens.length).toBe(1)
    expect(beefyPosition.tokens[0].tokenId).toBe(
      'op-mainnet:0x4456d13fc6736e8e8330394c0c622103e06ea419',
    )
    expect(beefyPosition.tokens[0].balance).toBe('60')
    expect(beefyPosition.tokens[0].priceUsd).toBe('0.5') // Fallback price, since the token can't be found
    expect(beefyPosition.balance).toBe('30')
    expect(beefyPosition.priceUsd).toBe('1')
    expect(beefyPosition.supply).toBe('1000')
  })
})
