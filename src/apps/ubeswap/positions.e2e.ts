import { getTokenId } from '../../runtime/getTokenId'
import { NetworkId } from '../../types/networkId'
import { toSerializedDecimalNumber } from '../../types/numbers'
import { AppTokenPosition, BaseToken } from '../../types/positions'
import farms from './data/farms.json'
import hook from './positions'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['celo-mainnet'],
      '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    )

    // ube v2 pool definitions
    expect(
      positions.filter((p) => p.type === 'app-token-definition').length,
    ).toBeGreaterThan(0)

    // ube v2 farm definitions and ube v3 pools are both contract definitions.
    // We must call displayProps to distinguish v2 farms from v3 pools, and for that to
    // work we first create a resolvedTokensByTokenId object with all the relevant tokens,
    // like the runtime does.

    const celoTokenId = getTokenId({
      networkId: NetworkId['celo-mainnet'],
      isNative: true,
      address: '0x471ece3750da237f93b8e339c536989b8978a438',
    })
    const cUsdTokenId = getTokenId({
      networkId: NetworkId['celo-mainnet'],
      isNative: false,
      address: '0x765de816845861e75a25fca122bb6898b8b1282a',
    })

    const resolvedTokensByTokenId: Record<
      string,
      Omit<AppTokenPosition, 'balance'> | Omit<BaseToken, 'balance'>
    > = {
      [celoTokenId]: {
        type: 'base-token',
        networkId: NetworkId['celo-mainnet'],
        decimals: 18,
        symbol: 'CELO',
        priceUsd: toSerializedDecimalNumber(0),
        tokenId: celoTokenId,
      },
      [cUsdTokenId]: {
        type: 'base-token',
        networkId: NetworkId['celo-mainnet'],
        decimals: 18,
        symbol: 'cUSD',
        priceUsd: toSerializedDecimalNumber(0),
        tokenId: cUsdTokenId,
      },
    }
    for (const farm of farms) {
      const tokenId = getTokenId({
        networkId: NetworkId['celo-mainnet'],
        isNative: false,
        address: farm.lpAddress.toLowerCase(),
      })
      resolvedTokensByTokenId[tokenId] = {
        type: 'app-token',
        appId: 'ubeswap',
        appName: 'Ubeswap',
        availableShortcutIds: [],
        displayProps: {
          title: 'Ubeswap',
          description: 'Ubeswap',
          imageUrl: '',
        },
        label: 'Ubeswap',
        tokens: [],
        supply: toSerializedDecimalNumber(0),
        pricePerShare: [],
        tokenId,
        address: farm.lpAddress.toLowerCase(),
        networkId: NetworkId['celo-mainnet'],
        symbol: 'RANDOM',
        decimals: 18,
        priceUsd: toSerializedDecimalNumber(0),
      }
    }

    const contractPositions = positions.filter(
      (p) => p.type === 'contract-position-definition',
    )
    const displayTexts = await Promise.all(
      contractPositions.map(async (position) => {
        return typeof position.displayProps === 'function'
          ? position.displayProps({ resolvedTokensByTokenId })
          : position.displayProps
      }),
    )

    // Uniswap v2 farm definitions
    expect(
      displayTexts.filter((displayText) => displayText.description === 'Farm')
        .length,
    ).toBeGreaterThan(0)

    // Uniswap v3 definitions
    expect(
      displayTexts.filter((displayText) => displayText.description === 'Pool')
        .length,
    ).toBeGreaterThan(0)
  })

  it('should get no definitions for an address with no blockchain interaction', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['celo-mainnet'],
      '0x0000000000000000000000000000000000007e57',
    )
    expect(positions.length).toBe(0)
  })
})
