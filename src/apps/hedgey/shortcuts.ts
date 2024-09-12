import { Address, createPublicClient, http, encodeFunctionData } from 'viem'
import { celo } from 'viem/chains'
import { createShortcut, ShortcutsHook } from '../../types/shortcuts'
import { getHedgeyPlanNfts } from './nfts'
import { tokenVestingPlansAbi } from './abis/token-vesting-plans'
import { NetworkId } from '../../types/networkId'
import { ZodAddressLowerCased } from '../../types/address'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

const hook: ShortcutsHook = {
  async getShortcutDefinitions(networkId: NetworkId, address?: string) {
    if (networkId !== NetworkId['celo-mainnet'] || !address) {
      return []
    }

    const planNfts = await getHedgeyPlanNfts({ address })

    return planNfts.map((planNft) =>
      createShortcut({
        id: `${planNft.contractAddress}:${planNft.tokenId}`,
        name: 'Claim',
        description: 'Claim vested rewards',
        networkIds: [NetworkId['celo-mainnet']],
        category: 'claim',
        triggerInputShape: {
          positionAddress: ZodAddressLowerCased,
        },
        async onTrigger({ networkId, address, positionAddress }) {
          // positionAddress === planNft.contractAddress
          const { request } = await client.simulateContract({
            address: positionAddress,
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

          return {
            transactions: [
              {
                networkId,
                from: address,
                to: positionAddress as Address,
                data,
              },
            ],
          }
        },
      }),
    )
  },
}

export default hook
