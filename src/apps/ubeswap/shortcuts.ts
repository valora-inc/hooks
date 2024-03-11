import { Address, createPublicClient, http, encodeFunctionData } from 'viem'
import { celo } from 'viem/chains'
import { ShortcutsHook } from '../../types/shortcuts'
import { stakingRewardsAbi } from './abis/staking-rewards'
import {NetworkId} from "../../api/networkId";

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

const hook: ShortcutsHook = {
  getShortcutDefinitions() {
    return [
      {
        id: 'claim-reward',
        name: 'Claim',
        description: 'Claim rewards for staked liquidity',
        networks: [NetworkId["celo-mainnet"]],
        category: 'claim',
        async onTrigger(network, address, positionAddress) {
          // This isn't strictly needed, but will help while we're developing shortcuts
          const { request } = await client.simulateContract({
            address: positionAddress as Address, // This is the farm address
            abi: stakingRewardsAbi,
            functionName: 'getReward',
            account: address as Address,
          })

          const data = encodeFunctionData({
            abi: request.abi,
            args: request.args,
            functionName: request.functionName,
          })

          return [
            {
              network,
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
