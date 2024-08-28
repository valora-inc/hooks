import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem'
import { z } from 'zod'
import { getClient } from '../../runtime/client'
import { ZodAddressLowerCased } from '../../types/address'
import { NetworkId } from '../../types/networkId'
import {
  createShortcut,
  ShortcutsHook,
  tokenAmounts,
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
        category: 'deposit',
        triggerInputShape: {
          tokens: tokenAmounts.length(1),
          positionAddress: ZodAddressLowerCased,
          // these two will be passed in the shortcutTriggerArgs. It's a temporary workaround before we can directly extract these info from the tokenId
          tokenAddress: ZodAddressLowerCased,
          tokenDecimals: z.coerce.number(),
        },

        async onTrigger({
          networkId,
          address,
          tokens,
          positionAddress,
          tokenAddress,
          tokenDecimals,
        }) {
          const walletAddress = address as Address
          const transactions: Transaction[] = []

          // amount in smallest unit
          const amountToSupply = parseUnits(tokens[0].amount, tokenDecimals)

          const client = getClient(networkId)

          const approvedAllowanceForSpender = await client.readContract({
            address: tokenAddress,
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
              to: tokenAddress,
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
        category: 'withdraw',
        triggerInputShape: {
          tokens: tokenAmounts.length(1),
          positionAddress: ZodAddressLowerCased,
          // this will be passed in the shortcutTriggerArgs. It's a temporary workaround before we can directly extract these info from the tokenId
          tokenDecimals: z.coerce.number(),
        },
        async onTrigger({
          networkId,
          address,
          tokens,
          positionAddress,
          tokenDecimals,
        }) {
          const walletAddress = address as Address
          const transactions: Transaction[] = []

          const amountToWithdraw = parseUnits(tokens[0].amount, tokenDecimals)

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
