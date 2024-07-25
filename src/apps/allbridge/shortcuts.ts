import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem'
import { z } from 'zod'
import { getClient } from '../../runtime/client'
import { ZodAddressLowerCased } from '../../types/address'
import { NetworkId } from '../../types/networkId'
import {
  createShortcut,
  ShortcutsHook,
  Transaction,
} from '../../types/shortcuts'
import { poolAbi } from './abis/pool'
import { getAllBridgeTokenInfo } from './api'

// Hardcoding for now
const GAS = 1_000_000n

const hook: ShortcutsHook = {
  async getShortcutDefinitions(networkId: NetworkId, _address?: string) {
    const tokenInfo = await getAllBridgeTokenInfo({ networkId })

    // TODO(tomm): How should we loop through allBridgeAddresses?
    const poolContractAddress = tokenInfo.tokens[0].poolAddress

    return [
      createShortcut({
        id: 'deposit',
        name: 'Deposit',
        description: 'Lend your assets to earn interest',
        networkIds: [networkId],
        // category: 'deposit',
        triggerInputShape: {
          token: z.object({
            // TODO: consider requiring only tokenId and (decimal) amount
            // Right now it would mean more changes in hooks
            address: ZodAddressLowerCased,
            decimals: z.coerce.number(),
            amount: z.string(), // in decimal string
          }),
        },
        async onTrigger({ networkId, address, token }) {
          const walletAddress = address as Address
          const transactions: Transaction[] = []

          // amount in smallest unit
          const amountToSupply = parseUnits(token.amount, token.decimals)

          const client = getClient(networkId)

          const approvedAllowanceForSpender = await client.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [walletAddress, poolContractAddress],
          })

          if (approvedAllowanceForSpender < amountToSupply) {
            const data = encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [poolContractAddress, amountToSupply],
            })

            const approveTx: Transaction = {
              networkId,
              from: walletAddress,
              to: token.address,
              data,
            }
            transactions.push(approveTx)
          }

          const supplyTx: Transaction = {
            networkId,
            from: walletAddress,
            to: poolContractAddress,
            data: encodeFunctionData({
              abi: poolAbi,
              functionName: 'deposit',
              args: [token.address, amountToSupply, walletAddress, 0],
            }),
            // TODO: consider moving this concern to the runtime
            // which would simulate the transaction(s) to get these
            gas: GAS,
            estimatedGasUse: GAS / 3n,
          }

          transactions.push(supplyTx)

          return transactions
        },
      }),
    ]
  },
}

export default hook
