import { getPositions } from './getPositions'
import * as hooks from './getHooks'
import { ContractPositionDefinition, PositionsHook } from '../types/positions'
import { toDecimalNumber } from '../types/numbers'
import { logger } from '../log'

const getHooksSpy = jest.spyOn(hooks, 'getHooks')

const lockedCeloTestHook: PositionsHook = {
  getInfo() {
    return {
      id: 'locked-celo-test',
      name: 'Locked CELO Test',
      description: '',
    }
  },
  async getPositionDefinitions(network, _address) {
    const position: ContractPositionDefinition = {
      type: 'contract-position-definition',
      network,
      address: '0x6cc083aed9e3ebe302a6336dbc7c921c9f03349e',
      tokens: [
        { address: '0x471ece3750da237f93b8e339c536989b8978a438', network },
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
  getAppTokenDefinition() {
    throw new Error('Not implemented')
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
  getAppTokenDefinition() {
    throw new Error('Not implemented')
  },
}

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
    const positions = await getPositions(
      'celo',
      '0x0000000000000000000000000000000000007e57',
    )
    expect(positions.length).toBe(1)
    expect(positions.map((p) => p.appId)).toEqual(['locked-celo-test'])
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1)
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      { err: new Error('This hook fails') },
      'Failed to get position definitions for failing-hook',
    )
  })
})
