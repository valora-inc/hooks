import got from 'got'
import { hedgeyContractNames } from './config'

interface Nft {
  contractAddress: string
  tokenId: string
  metadata?: {
    image: string
  }
  media: {
    raw: string
    gateway: string
  }[]
}

export async function getHedgeyPlanNfts({
  address,
  contractAddresses,
}: {
  address: string
  contractAddresses?: Set<string>
}) {
  contractAddresses =
    contractAddresses ?? new Set(Object.keys(hedgeyContractNames))

  const pagination = got.paginate<Nft>(
    'https://api.mainnet.valora.xyz/getNfts',
    {
      searchParams: { address },
      pagination: {
        transform: (response) => {
          return JSON.parse(response.body as string).result
        },
        paginate: (response) => {
          const pageKey = JSON.parse(response.body as string).pageKey
          if (pageKey) {
            return {
              searchParams: { address, pageKey },
            }
          }
          return false
        },
      },
    },
  )

  const result: Nft[] = []
  for await (const nft of pagination) {
    if (contractAddresses.has(nft.contractAddress)) {
      result.push(nft)
    }
  }

  return result
}
