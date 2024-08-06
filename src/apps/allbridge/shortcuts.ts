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

// Hardcoding for now
const GAS = 1_000_000n

const hook: ShortcutsHook = {
  async getShortcutDefinitions(networkId: NetworkId) {
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
          positionAddress: ZodAddressLowerCased,
        },

        async onTrigger({ networkId, address, token, positionAddress }) {
          const walletAddress = address as Address
          const transactions: Transaction[] = []

          // amount in smallest unit
          const amountToSupply = parseUnits(token.amount, token.decimals)

          const client = getClient(networkId)

          const approvedAllowanceForSpender = await client.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [walletAddress, positionAddress],
          })

          if (approvedAllowanceForSpender < amountToSupply) {
            const data = encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [positionAddress, amountToSupply],
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
            to: positionAddress,
            data: encodeFunctionData({
              abi: poolAbi,
              functionName: 'deposit',
              args: [amountToSupply],
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
      createShortcut({
        id: 'withdraw',
        name: 'Withdraw',
        description: 'Withdraw your assets',
        networkIds: [networkId],
        triggerInputShape: {
          token: z.object({
            decimals: z.coerce.number(),
            amount: z.string(),
          }),
          positionAddress: ZodAddressLowerCased,
        },
        async onTrigger({ networkId, address, token, positionAddress }) {
          const walletAddress = address as Address
          const transactions: Transaction[] = []

          const amountToWithdraw = parseUnits(token.amount, token.decimals)

          const withdrawTx: Transaction = {
            networkId,
            from: walletAddress,
            to: positionAddress,
            data: encodeFunctionData({
              abi: poolAbi,
              functionName: 'withdraw',
              args: [amountToWithdraw],
            }),
          }

          transactions.push(withdrawTx)

          return transactions
        },
      }),
      createShortcut({
        id: 'claim-rewards',
        name: 'Claim',
        description: 'Claim rewards',
        networkIds: [networkId],
        category: 'claim',
        triggerInputShape: {
          positionAddress: ZodAddressLowerCased,
        },
        async onTrigger({ networkId, address, positionAddress }) {
          const walletAddress = address as Address

          const claimTx: Transaction = {
            networkId,
            from: walletAddress,
            to: positionAddress,
            data: encodeFunctionData({
              abi: poolAbi,
              functionName: 'claimRewards',
              args: [],
            }),
          }

          return [claimTx]
        },
      }),
    ]
  },
}

export default hook
