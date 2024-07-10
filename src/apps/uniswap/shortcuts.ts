import { Address, encodeFunctionData } from 'viem'
import { z } from 'zod'
import { getClient } from '../../runtime/client'
import { NetworkId } from '../../types/networkId'
import { ShortcutsHook, createShortcut } from '../../types/shortcuts'
import { uniV3NftManagerAbi } from './abis/nftManager'
import { UINT128_MAX_VALUE, UNI_V3_ADDRESSES } from './positions'

const hook: ShortcutsHook = {
  async getShortcutDefinitions(_networkId: NetworkId, _address?: string) {
    return [
      createShortcut({
        id: 'uniswapv3-claim-fees',
        name: 'Claim',
        description: 'Claim earned fees for pools',
        networkIds: [
          NetworkId['celo-mainnet'],
          NetworkId['arbitrum-one'],
          NetworkId['op-mainnet'],
          NetworkId['ethereum-mainnet'],
        ],
        category: 'claim',
        triggerInputShape: {
          positionAddress: z.string(),
          // tokenId: z.bigint(),
        },
        async onTrigger({
          networkId,
          address,
          // tokenId, // TODO: Use this once it works
          positionAddress,
        }) {
          const addresses = UNI_V3_ADDRESSES[networkId]
          if (!addresses) {
            return []
          }
          const [, tokenId] = positionAddress.split('-')
          // This isn't strictly needed, but will help while we're developing shortcuts
          const client = getClient(networkId)
          const { request } = await client.simulateContract({
            address: addresses.nftPositions,
            abi: uniV3NftManagerAbi,
            functionName: 'collect',
            args: [
              {
                tokenId: BigInt(tokenId),
                recipient: address as Address,
                amount0Max: UINT128_MAX_VALUE,
                amount1Max: UINT128_MAX_VALUE,
              },
            ],
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
              to: addresses.nftPositions,
              data,
            },
          ]
        },
      }),
    ]
  },
}

export default hook
