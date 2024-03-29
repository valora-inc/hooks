import { getTokenId } from './getTokenId'
import { NetworkId } from '../types/networkId'
import { isNative } from './isNative'
import mocked = jest.mocked

jest.mock('./isNative')

describe('getTokenId', () => {
  it('uses `native` if native', () => {
    expect(
      getTokenId({
        isNative: true,
        address: '0x123',
        networkId: NetworkId['celo-mainnet'],
      }),
    ).toBe('celo-mainnet:native')
  })
  it('lower cases the address in the ID', () => {
    expect(
      getTokenId({
        isNative: false,
        address: '0xABC',
        networkId: NetworkId['ethereum-mainnet'],
      }),
    ).toBe('ethereum-mainnet:0xabc')
  })
  it('checks if native if it is not clear at the consumer level one way or the other', () => {
    mocked(isNative).mockReturnValueOnce(true)
    expect(
      getTokenId({
        address: 'mock-native-address',
        networkId: NetworkId['celo-mainnet'],
      }),
    ).toBe('celo-mainnet:native')
    expect(isNative).toHaveBeenCalledWith({
      address: 'mock-native-address',
      networkId: NetworkId['celo-mainnet'],
    })
  })
})
