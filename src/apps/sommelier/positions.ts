import { getClient } from '../../runtime/client'
import { getTokenId } from '../../runtime/getTokenId'
import { toDecimalNumber } from '../../types/numbers'
import {
  PositionsHook,
  PricePerShareContext,
  UnknownAppTokenError,
} from '../../types/positions'
import { cellarV0821Abi } from './abis/cellar'
import { getSommStrategiesData } from './sommelierApi'

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'sommelier',
      name: 'Sommelier',
      description: 'Sommelier vaults',
    }
  },
  async getPositionDefinitions({ networkId }) {
    const client = getClient(networkId)
    const cellars = await getSommStrategiesData(networkId)

    // TODO: use all settled?
    const results = await Promise.all(
      cellars.map(async (cellar) => {
        const [underlyingAsset, underlyingAssetSymbol, cellarName] =
          await Promise.all([
            client.readContract({
              address: cellar.address,
              abi: cellarV0821Abi,
              functionName: 'asset',
            }),
            client.readContract({
              address: cellar.address,
              abi: cellarV0821Abi,
              functionName: 'symbol',
            }),
            client.readContract({
              address: cellar.address,
              abi: cellarV0821Abi,
              functionName: 'name',
            }),
          ])

        return {
          type: 'app-token-definition' as const,
          pricePerShare: async ({ tokensByTokenId }: PricePerShareContext) => {
            const tokenId = getTokenId({
              address: cellar.address,
              networkId,
            })
            const { decimals } = tokensByTokenId[tokenId]
            return [toDecimalNumber(BigInt(cellar.shareValue), decimals)]
          },
          networkId,
          address: cellar.address,
          tokens: [
            {
              address: underlyingAsset.toLowerCase(),
              networkId,
            },
          ],
          displayProps: () => {
            return {
              title: cellarName,
              description: underlyingAssetSymbol,
              imageUrl:
                'https://raw.githubusercontent.com/mobilestack-xyz/hooks/main/src/apps/sommelier/assets/sommelier.png',
              manageUrl: cellar.strategySlug
                ? `https://app.somm.finance/strategies/${cellar.strategySlug}/manage`
                : undefined,
            }
          },
        }
      }),
    )

    return results
  },
  async getAppTokenDefinition({ networkId, address }) {
    throw new UnknownAppTokenError({ networkId, address })
  },
}

export default hook
