import { NetworkId } from '../types/networkId'
import { toDecimalNumber } from '../types/numbers'
import { getPositionId } from './getPositionId'

describe('getPositionId', () => {
  it('returns the token ID for app-token-definition', () => {
    expect(
      getPositionId({
        type: 'app-token-definition',
        networkId: NetworkId['ethereum-mainnet'],
        address: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
        tokens: [
          {
            address: '0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e',
            networkId: NetworkId['ethereum-mainnet'],
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
      }),
    ).toBe('ethereum-mainnet:0xda7f463c27ec862cfbf2369f3f74c364d050d93f')
  })
  it('returns the token ID with extra ID for contract-position-definition', () => {
    expect(
      getPositionId({
        type: 'contract-position-definition',
        networkId: NetworkId['celo-mainnet'],
        address: '0x6cc083aed9e3ebe302a6336dbc7c921c9f03349e',
        extraId: 'locked-celo',
        tokens: [
          {
            address: '0x471ece3750da237f93b8e339c536989b8978a438',
            networkId: NetworkId['celo-mainnet'],
          },
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
      }),
    ).toBe(
      'celo-mainnet:0x6cc083aed9e3ebe302a6336dbc7c921c9f03349e:locked-celo',
    )
  })
  it('returns the token ID for contract-position-definition if no extra ID is set', () => {
    expect(
      getPositionId({
        type: 'contract-position-definition',
        networkId: NetworkId['celo-mainnet'],
        address: '0x6cc083aed9e3ebe302a6336dbc7c921c9f03349e',
        tokens: [
          {
            address: '0x471ece3750da237f93b8e339c536989b8978a438',
            networkId: NetworkId['celo-mainnet'],
          },
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
      }),
    ).toBe('celo-mainnet:0x6cc083aed9e3ebe302a6336dbc7c921c9f03349e')
  })
})
