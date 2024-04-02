import * as $ from 'shelljs'

describe('getPositions', () => {
  it.each(['celo-mainnet', 'ethereum-mainnet'])(
    'should get the address positions successfully for networkId %s',
    (networkId) => {
      const result = $.exec(
        `yarn getPositions --address 0x2b8441ef13333ffa955c9ea5ab5b3692da95260d -n ${networkId}`,
      )
      expect(result.code).toBe(0)
    },
  )
})
