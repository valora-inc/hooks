import { Address } from 'viem'
import { logger } from '../../log'
import { NetworkId } from '../../types/networkId'
import got from '../../utils/got'

const NETWORK_ID_TO_SOMM_CHAIN: Record<NetworkId, string | null> = {
  [NetworkId['celo-mainnet']]: null,
  [NetworkId['ethereum-mainnet']]: 'ethereum',
  [NetworkId['arbitrum-one']]: 'arbitrum',
  [NetworkId['op-mainnet']]: 'optimism',
  [NetworkId['polygon-pos-mainnet']]: null,
  [NetworkId['base-mainnet']]: null,
  [NetworkId['celo-alfajores']]: null,
  [NetworkId['ethereum-sepolia']]: null,
  [NetworkId['arbitrum-sepolia']]: null,
  [NetworkId['op-sepolia']]: null,
  [NetworkId['polygon-pos-amoy']]: null,
  [NetworkId['base-sepolia']]: null,
}

export async function getSommStrategiesData(networkId: NetworkId) {
  const { result } = await got
    .get(`https://app.somm.finance/api/sommelier-api-all-strategies-data`)
    .json<{
      result: {
        data: {
          cellars: {
            id: Address
            shareValue: string
            tvlTotal: number
            chain: string
          }[]
        }
      }
    }>()

  return result.data.cellars
    .filter((cellar) => cellar.chain === NETWORK_ID_TO_SOMM_CHAIN[networkId])
    .map((cellar) => {
      const address = cellar.id.split('-')[0].toLowerCase() as Address // some cellars have a suffix to the address (e.g. `-arbitrum`), which we do not need
      const strategySlug = cellarAddressToSlug[address]
      if (!strategySlug) {
        logger.warn(`No strategy slug found for cellar address ${address}`)
      }

      return {
        ...cellar,
        address,
        strategySlug, // used to generate the manageUrl
      }
    })
}

// Derived from the hard coded config in the Sommelier website source code
// https://github.com/PeggyJV/sommelier-strangelove/blob/ca7bd6605bc868a1393d820f13b341ae5a5f1ead/src/utils/config.ts,
// filtered by the vaults returned by
// https://app.somm.finance/api/sommelier-api-all-strategies-data
export const cellarAddressToSlug: Record<string, string> = {
  '0x0274a704a6d9129f90a62ddc6f6024b33ecdad36': 'Real-Yield-BTC',
  '0x03df2a53cbed19b824347d6a45d09016c2d1676a': 'DeFi-Stars',
  '0x05641a27c82799aaf22b436f20a3110410f29652': 'Steady-MATIC',
  '0x0c190ded9be5f512bd72827bdad4003e9cc7975c': 'Turbo-GHO',
  '0x18ea937aba6053bc232d9ae2c42abe7a8a2be440': 'Real-Yield-ENS',
  '0x19b8d8fc682fc56fbb42653f68c7d48dd3fe597e': 'Turbo-ETHx',
  '0x1dffb366b5c5a37a12af2c127f31e8e0ed86bdbe': 'Turbo-rsETH',
  '0x27500de405a3212d57177a789e30bb88b0adbec5': 'Turbo-ezETH',
  '0x3f07a84ecdf494310d397d24c1c78b041d2fa622': 'Steady-ETH',
  '0x4068bdd217a45f8f668ef19f1e3a1f043e4c4934': 'Real-Yield-LINK',
  '0x4986fd36b6b16f49b43282ee2e24c5cf90ed166d': 'Steady-BTC',
  '0x6a6af5393dc23d7e3db28d28ef422db7c40932b6': 'Real-Yield-UNI',
  '0x6e2dac3b9e9adc0cbbae2d0b9fd81952a8d33872': 'ETH-BTC-Momentum',
  '0x6f069f711281618467dae7873541ecc082761b33': 'Steady-UNI',
  '0x6b7f87279982d919bbf85182ddeab179b366d8f2': 'ETH-BTC-Trend',
  '0x6c1edce139291af5b84fb1e496c9747f83e876c9': 'Turbo-divETH',
  '0x6c51041a91c91c86f3f08a72cb4d3f67f1208897': 'ETH-Trend-Growth',
  '0x7bad5df5e11151dc5ee1a648800057c5c934c0d5': 'AAVE',
  '0x97e6e0a40a3d02f12d1cec30ebfbae04e37c119e': 'Real-Yield-USD',
  '0x9a7b4980c6f0fcaa50cd5f288ad7038f434c692e': 'Turbo-eETH',
  '0xc7b69e15d86c5c1581dacce3cacaf5b68cd6596f': 'Real-Yield-1Inch',
  '0xdbe19d1c3f21b1bb250ca7bdae0687a97b5f77e6': 'Fraximal',
  '0xb5b29320d2dde5ba5bafa1ebcd270052070483ec': 'Real-Yield-ETH',
  '0xc7372ab5dd315606db799246e8aa112405abaeff': 'Turbo-STETH-(steth-deposit)',
  '0xcbf2250f33c4161e18d4a2fa47464520af5216b5': 'Real-Yield-SNX',
  '0xcf4b531b4cde95bd35d71926e09b2b54c564f5b6': 'Morpho-ETH',
  '0xd33dad974b938744dac81fe00ac67cb5aa13958e': 'Turbo-SWETH',
  '0xdadc82e26b3739750e036dfd9defd3ed459b877a': 'Turbo-eETHV2',
  '0xfd6db5011b171b05e1ea3b92f9eacaeeb055e971': 'Turbo-STETH',
  '0x392b1e6905bb8449d26af701cdea6ff47bf6e5a8': 'real-yield-usd-arb',
  '0xa73b0b48e26e4b8b24cead149252cc275dee99a6': 'Real-Yield-USD-Arbitrum',
  '0xc47bb288178ea40bf520a91826a3dee9e0dbfa4c': 'real-yield-eth-opt',
  '0xd3bb04423b0c98abc9d62f201212f44dc2611200': 'real-yield-eth-scroll',
}
