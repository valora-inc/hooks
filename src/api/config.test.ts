import { networkIdToRpcUrlTransform } from './config'

describe('config', () => {
  describe('networkIdToRpcUrlTransform', () => {
    it('parses network id/rpc url pairs joined by |, and pairs separated by spaces', () => {
      const input =
        'ethereum-mainnet|https://my-endpoint-name.quiknode.pro/my-api-key celo-mainnet|https://forno.celo.org'
      const expected = {
        'ethereum-mainnet': 'https://my-endpoint-name.quiknode.pro/my-api-key',
        'celo-mainnet': 'https://forno.celo.org',
      }
      expect(networkIdToRpcUrlTransform(input)).toStrictEqual(expected)
    })
    it('throws an error if the network id is invalid', () => {
      const input =
        'invalid-network-id|https://my-endpoint-name.quiknode.pro/my-api-key'
      expect(() => networkIdToRpcUrlTransform(input)).toThrow(
        'Invalid network id: invalid-network-id',
      )
    })
    it('throws an error if the rpc url is empty', () => {
      const input = 'ethereum-mainnet|'
      expect(() => networkIdToRpcUrlTransform(input)).toThrow(
        'Invalid rpc url for network id: ethereum-mainnet',
      )
    })
    it('returns an empty object if the input is empty', () => {
      expect(networkIdToRpcUrlTransform('')).toStrictEqual({})
    })
  })
})
