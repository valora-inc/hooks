import { logger } from '../../log'
import { getClient } from '../../runtime/client'
import { getTokenId } from '../../runtime/getTokenId'
import { toDecimalNumber } from '../../types/numbers'
import {
  PositionDefinition,
  PositionsHook,
  PricePerShareContext,
  UnknownAppTokenError,
} from '../../types/positions'
import { cellarV0821Abi } from './abis/cellar'
import { getSommStrategiesData } from './sommelierApi'

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'somm',
      name: 'Somm',
      description: '', // Not used anywhere
    }
  },
  async getPositionDefinitions({ networkId }) {
    const client = getClient(networkId)
    const cellars = await getSommStrategiesData(networkId)
    const positionDefinitions: PositionDefinition[] = []

    const results = await Promise.allSettled(
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

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        positionDefinitions.push(result.value)
      } else {
        logger.warn(
          {
            error: result.reason,
          },
          'Failed to fetch Sommelier position definition',
        )
      }
    })

    return positionDefinitions
  },
  async getAppTokenDefinition({ networkId, address }) {
    throw new UnknownAppTokenError({ networkId, address })
  },
}

export default hook
