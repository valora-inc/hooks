import { NetworkId } from '../types/networkId'
import { isNative } from './isNative'

describe('isNative', () => {
  it('recognizes the curve identifier for ETH as native', () => {
    expect(
      isNative({
        networkId: NetworkId['ethereum-mainnet'],
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      }),
    ).toBe(true)
  })
  it('recognizes celo mainnet CELO as native', () => {
    expect(
      isNative({
        networkId: NetworkId['celo-mainnet'],
        address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      }),
    ).toBe(true)
  })
  it('recognizes celo alfajores CELO as native', () => {
    expect(
      isNative({
        networkId: NetworkId['celo-alfajores'],
        address: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
      }),
    ).toBe(true)
  })
  it('recognizes other addresses as non-native', () => {
    expect(
      isNative({
        networkId: NetworkId['celo-mainnet'],
        address: '0x123',
      }),
    ).toBe(false)
  })
})
