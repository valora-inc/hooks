import { Address, createPublicClient, http, encodeFunctionData } from 'viem'
import { celo } from 'viem/chains'
import { ShortcutsHook } from '../../types/shortcuts'
import { ubiSchemeAbi } from './abis/ubi-scheme'
import { NetworkId } from '../../types/networkId'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

const hook: ShortcutsHook = {
  async getShortcutDefinitions(networkId: NetworkId, _address?: string) {
    if (networkId !== NetworkId['celo-mainnet']) {
      return []
    }

    return [
      {
        id: 'claim-reward',
        name: 'Claim',
        description: 'Claim daily UBI rewards',
        networkIds: [NetworkId['celo-mainnet']],
        category: 'claim',
        async onTrigger(networkId, address, positionAddress) {
          // This isn't strictly needed, but will help while we're developing shortcuts
          const { request } = await client.simulateContract({
            address: positionAddress as Address, // This is the ubi contract address
            abi: ubiSchemeAbi,
            functionName: 'claim',
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
              to: positionAddress,
              data,
            },
          ]
        },
      },
    ]
  },
}

export default hook
