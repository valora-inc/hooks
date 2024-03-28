import { getTokenId } from './getTokenId'
import { NetworkId } from '../api/networkId'

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
})
