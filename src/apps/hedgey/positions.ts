import { celo } from 'viem/chains'
import { createPublicClient, http, Address } from 'viem'
import { toDecimalNumber } from '../../types/numbers'
import {
  ContractPositionDefinition,
  PositionsHook,
} from '../../types/positions'
import { hedgeyContractNames, hedgeyDefaultImageUrl } from './config'
import { erc20Abi } from '../../abis/erc-20'
import { tokenVestingPlansAbi } from './abis/token-vesting-plans'
import { getHedgeyPlanNfts } from './nfts'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'hedgey',
      name: 'Hedgey',
      description: 'Hedgey vesting plans',
    }
  },

  async getPositionDefinitions(network: string, address: string) {
    const planNfts = await getHedgeyPlanNfts({ address })
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
            ?.gateway ?? hedgeyDefaultImageUrl

        return {
          type: 'contract-position-definition',
          network,
          address: planNft.contractAddress,
          tokens: [{ address: tokenAddress, network, category: 'claimable' }],
          availableShortcutIds: [
            `${planNft.contractAddress}:${planNft.tokenId}`,
          ],
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
