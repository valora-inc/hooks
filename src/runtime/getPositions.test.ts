import { getPositions } from './getPositions'
import * as hooks from './getHooks'
import {
  AppTokenPositionDefinition,
  ContractPositionDefinition,
  PositionsHook,
} from '../types/positions'
import { toDecimalNumber } from '../types/numbers'
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
      18n, // Decimals
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
})
