import got from 'got'
import { toDecimalNumber } from '../../types/numbers'
import {
  ContractPositionDefinition,
  PositionsHook,
} from '../../types/positions'
import { celo } from 'viem/chains'
import { createPublicClient, http, Address } from 'viem'
import { erc20Abi } from '../../abis/erc-20'

import { tokenVestingPlansAbi } from './abis/token-vesting-plans'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

// TODO(sbw): there's others we need to add
// https://github.com/hedgey-finance/Locked_VestingTokenPlans#mainnet-deployments
const hedgeyContractNames: Record<string, string> = {
  '0xd240f76c57fb18196a864b8b06e9b168c98c4524': 'Vesting Plan',
}

// TODO(sbw): not sure what the right default image URL should be
const DEFAULT_IMAGE_URL =
  'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/CELO.png'

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

async function getNfts(address: string) {
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
    if (nft.contractAddress in hedgeyContractNames) {
      result.push(nft)
    }
  }

  return result
}

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'hedgey',
      name: 'Hedgey',
      description: 'Hedgey vesting plans',
    }
  },

  async getPositionDefinitions(network: string, address: string) {
    const planNfts = await getNfts(address)
    const now = BigInt(Math.floor(new Date().getTime() / 1000))

    const positions: ContractPositionDefinition[] = await Promise.all(
      planNfts.map(async (planNft) => {
        const tokenVestingPlanContract = {
          address: planNft.contractAddress as Address,
          abi: tokenVestingPlansAbi,
        }
        const planId = planNft.tokenId
        const [planBalanceOfResult, plansResult] = await client.multicall({
          contracts: [
            {
              ...tokenVestingPlanContract,
              functionName: 'planBalanceOf',
              args: [BigInt(planId), now, now],
            },
            {
              ...tokenVestingPlanContract,
              functionName: 'plans',
              args: [BigInt(planId)],
            },
          ],
          allowFailure: false,
        })

        const tokenAddress = plansResult[0].toLowerCase() as Address
        const [tokenDecimals, tokenSymbol] = await client.multicall({
          contracts: [
            {
              address: tokenAddress,
              abi: erc20Abi,
              functionName: 'decimals',
            },
            {
              address: tokenAddress,
              abi: erc20Abi,
              functionName: 'symbol',
            },
          ],
          allowFailure: false,
        })

        const balance = toDecimalNumber(planBalanceOfResult[0], tokenDecimals)
        const remainder = toDecimalNumber(planBalanceOfResult[1], tokenDecimals)
        const contractName = hedgeyContractNames[planNft.contractAddress]

        const imageUrl =
          planNft.media.find((media) => media.raw === planNft.metadata?.image)
            ?.gateway ?? DEFAULT_IMAGE_URL

        return {
          type: 'contract-position-definition',
          network,
          address: planNft.contractAddress,
          tokens: [{ address: tokenAddress, network }],
          balances: [balance],
          displayProps: {
            title: `${tokenSymbol} ${contractName} ${planId}`,
            description: `Claim ${balance.dp(2)} ${tokenSymbol} (${remainder.dp(
              2,
            )} unvested)`,
            imageUrl,
          },
        }
      }),
    )
    return positions
  },

  async getAppTokenDefinition(_) {
    throw new Error('Not implemented')
  },
}

export default hook
