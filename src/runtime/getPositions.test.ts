import { getPositions } from './getPositions'
import * as hooks from './getHooks'
import {
  AppTokenPosition,
  AppTokenPositionDefinition,
  ContractPositionDefinition,
  PositionsHook,
  TokensInfo,
  UnknownAppTokenError,
} from '../types/positions'
import { toDecimalNumber, toSerializedDecimalNumber } from '../types/numbers'
import { logger } from '../log'
import { NetworkId } from '../types/networkId'
import * as mockTokensInfo from './mockTokensInfo.json'
import { t } from '../../test/i18next'

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  createPublicClient: () => ({
    readContract: (...args: any) => mockReadContract(...args),
  }),
}))

const mockReadContract = jest.fn()

const getHooksSpy = jest.spyOn(hooks, 'getHooks')
const baseTokensInfo: TokensInfo = {}

for (const [tokenId, tokenInfo] of Object.entries(mockTokensInfo)) {
  baseTokensInfo[tokenId] = {
    ...tokenInfo,
    priceUsd: toSerializedDecimalNumber(tokenInfo.priceUsd ?? 0),
    // We don't have this info here but it's not yet needed for base tokens anyway
    balance: toDecimalNumber(0n, 0),
    totalSupply: toDecimalNumber(0n, 0),
    networkId: tokenInfo.networkId as NetworkId,
  }
}

const lockedCeloTestHook: PositionsHook = {
  getInfo() {
    return {
      id: 'locked-celo-test',
      name: 'Locked CELO Test',
      description: '',
    }
  },
  async getPositionDefinitions({ networkId }) {
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
  async getPositionDefinitions({ networkId: _networkId }) {
    throw new Error('This hook fails')
  },
}

const loggerErrorSpy = jest.spyOn(logger, 'error')
const loggerWarnSpy = jest.spyOn(logger, 'warn')

beforeEach(() => {
  jest.clearAllMocks()
})

describe(getPositions, () => {
  it('should ignore positions for hooks that throw errors', async () => {
    getHooksSpy.mockResolvedValue({
      'locked-celo-test': lockedCeloTestHook,
      'failing-hook': failingTestHook,
    })
    const positions = await getPositions({
      networkId: NetworkId['celo-mainnet'],
      address: '0x0000000000000000000000000000000000007e57',
      appIds: [],
      t,
      baseTokensInfo,
    })
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
      async getPositionDefinitions({ networkId }) {
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
    getHooksSpy.mockResolvedValue({
      'test-hook': testHook,
    })
    await expect(
      getPositions({
        networkId: NetworkId['celo-mainnet'],
        address: '0x0000000000000000000000000000000000007e57',
        appIds: [],
        t,
        baseTokensInfo,
      }),
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

      async getPositionDefinitions({ networkId }) {
        if (networkId !== NetworkId['op-mainnet']) {
          return []
        }

        return [
          {
            type: 'app-token-definition',
            networkId,
            // Beefy crvUSD/WBTC/WETH Vault
            // https://app.beefy.com/vault/curve-op-tricrypto-crvusd
            address: '0xf82160Bad52C235102174aE5E7f36d5099DEEad3',
            tokens: [
              {
                // Underlying Curve LP token
                address: '0x4456d13Fc6736e8e8330394c0C622103E06ea419',
                networkId,
                // Fallback until we can properly decompose the token into base tokens
                fallbackPriceUsd: toSerializedDecimalNumber(0.5),
              },
            ],
            // Meaning that 1 share of the vault is worth 2 underlying tokens
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

    mockReadContract.mockImplementation(async ({ address, functionName }) => {
      switch (functionName) {
        case 'symbol':
          switch (address) {
            case '0x4456d13Fc6736e8e8330394c0C622103E06ea419':
              return '3c-crvUSD'
            case '0xf82160Bad52C235102174aE5E7f36d5099DEEad3':
              return 'mooCurveTriCrypto-crvUSD'
            default:
              throw new Error(`Unexpected token address: ${address}`)
          }
        case 'decimals':
          return 18
        case 'totalSupply':
          return 1000n * 10n ** 18n
        case 'balanceOf':
          return 30n * 10n ** 18n
        default:
          throw new Error(`Unexpected functionName called: ${functionName}`)
      }
    })
    getHooksSpy.mockResolvedValue({
      'beefy-price-escape': testHook,
    })
    const positions = await getPositions({
      networkId: NetworkId['op-mainnet'],
      address: '0x0000000000000000000000000000000000007e57',
      appIds: [],
      t,
      baseTokensInfo,
    })
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

  it('should get tokens info for unlisted tokens once per unique token address and networkId', async () => {
    const testHook: PositionsHook = {
      getInfo() {
        return {
          id: 'test-hook',
          name: 'Test Hook',
          description: '',
        }
      },
      async getPositionDefinitions({ networkId }) {
        const position: ContractPositionDefinition = {
          type: 'contract-position-definition',
          networkId,
          address: '0x0000000000000000000000000000000000000001',
          tokens: [
            {
              address: '0x000000000000000000000000000000000000000a',
              networkId,
            },
          ],
          displayProps: {
            title: 'Test position',
            description: '',
            imageUrl: '',
          },
          balances: async () => {
            return [toDecimalNumber(10n, 18)]
          },
        }

        return [
          position,
          {
            ...position,
            address: '0x0000000000000000000000000000000000000002',
            tokens: [
              {
                // Same as the first position but with uppercase address
                address: '0x000000000000000000000000000000000000000A',
                networkId,
              },
            ],
          },
        ]
      },
      async getAppTokenDefinition(tokenDefinition) {
        throw new UnknownAppTokenError(tokenDefinition)
      },
    }

    mockReadContract.mockImplementation(async ({ functionName }) => {
      switch (functionName) {
        case 'symbol':
          return 'T1'
        case 'decimals':
          return 18
        case 'totalSupply':
          return 1000n * 10n ** 18n
        default:
          throw new Error(`Unexpected functionName called: ${functionName}`)
      }
    })
    getHooksSpy.mockResolvedValue({
      'test-hook': testHook,
    })
    const positions = await getPositions({
      networkId: NetworkId['celo-mainnet'],
      address: '0x0000000000000000000000000000000000007e57',
      appIds: [],
      t,
      baseTokensInfo,
    })
    // Just 3 calls to readContract, one for each unique token address and networkId
    expect(mockReadContract).toHaveBeenCalledTimes(3)
    expect(positions.length).toBe(2)
  })

  it('should warn and omit positions with the same address and networkId', async () => {
    // testHook and testHook2 both return positions with the same address
    // this should result in a warning and only one position being returned
    getHooksSpy.mockResolvedValue({
      'test-hook': lockedCeloTestHook,
      'test-hook2': lockedCeloTestHook,
    })
    const positions = await getPositions({
      networkId: NetworkId['celo-mainnet'],
      address: '0x0000000000000000000000000000000000007e57',
      appIds: [],
      t,
      baseTokensInfo,
    })
    expect(positions.length).toBe(1)
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1)
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        duplicateDefinition: expect.objectContaining({
          appId: 'test-hook2',
        }),
        initialDefinition: expect.objectContaining({
          appId: 'test-hook',
        }),
      }),
      'Duplicate position definition detected in app test-hook2 for 0x6cc083aed9e3ebe302a6336dbc7c921c9f03349e (celo-mainnet). test-hook already defined it. Skipping it. If this is unexpected and the position is a contract-position-definition, please specify a unique extraId.',
    )
  })

  it('should not warn about duplicates if the positions specify different extraIds', async () => {
    getHooksSpy.mockResolvedValue({
      'test-hook': lockedCeloTestHook,
      'test-hook2': {
        ...lockedCeloTestHook,
        async getPositionDefinitions({ networkId }) {
          return lockedCeloTestHook
            .getPositionDefinitions({ networkId, t })
            .then((positions) =>
              positions.map((p) => ({
                ...p,
                extraId: 'unique-id',
              })),
            )
        },
      },
    })
    const positions = await getPositions({
      networkId: NetworkId['celo-mainnet'],
      address: '0x0000000000000000000000000000000000007e57',
      appIds: [],
      t,
      baseTokensInfo,
    })
    expect(positions.length).toBe(2)
    expect(loggerWarnSpy).toHaveBeenCalledTimes(0)
  })
})
