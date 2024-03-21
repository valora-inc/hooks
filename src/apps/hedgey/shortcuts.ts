import { Address, createPublicClient, http, encodeFunctionData } from 'viem'
import { celo } from 'viem/chains'
import { ShortcutsHook } from '../../types/shortcuts'
import { getHedgeyPlanNfts } from './nfts'
import { tokenVestingPlansAbi } from './abis/token-vesting-plans'
import { NetworkId } from '../../api/networkId'
import {logger} from "../../log";

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

const SUPPORTED_NETWORKS: NetworkId[] = [NetworkId['celo-mainnet']]

const hook: ShortcutsHook = {
  async getShortcutDefinitions(networkId?: NetworkId, address?: string) {
    if (!networkId || !SUPPORTED_NETWORKS.includes(networkId)) {
      logger.info(`Unsupported network for hedgey: ${networkId}. Returning empty list of shortcut definitions.`)
      return []
    }
    if (!address) {
      logger.info(`No address provided for hedgey. Returning empty list of shortcut definitions.`)
      return []
    }

    const planNfts = await getHedgeyPlanNfts({ address })

    return planNfts.map((planNft) => ({
      id: `${planNft.contractAddress}:${planNft.tokenId}`,
      name: 'Claim',
      description: 'Claim vested rewards',
      networkIds: SUPPORTED_NETWORKS,
      category: 'claim',
      async onTrigger(networkId, address, positionAddress) {
        // positionAddress === planNft.contractAddress
        const { request } = await client.simulateContract({
          address: positionAddress as Address,
          abi: tokenVestingPlansAbi,
          functionName: 'redeemPlans',
          args: [[BigInt(planNft.tokenId)]],
          account: address as Address,
        })

        const data = encodeFunctionData({
          abi: request.abi,
          args: request.args,
          functionName: request.functionName,
        })

        return [
          {
            networkId,
            from: address,
            to: positionAddress as Address,
            data,
          },
        ]
      },
    }))
  },
}

export default hook
