import { Address, parseUnits, erc20Abi, encodeFunctionData } from 'viem'
import { z } from 'zod'
import { logger } from '../../log'
import { getClient } from '../../runtime/client'
import {
  simulateTransactions,
  UnsupportedSimulateRequest,
} from '../../runtime/simulateTransactions'
import { ZodAddressLowerCased } from '../../types/address'
import { NetworkId } from '../../types/networkId'
import {
  ShortcutsHook,
  createShortcut,
  tokenAmounts,
  Transaction,
} from '../../types/shortcuts'
import { vaultAbi } from './abis/vault'

// Hardcoded fallback if simulation isn't enabled
const DEFAULT_DEPOSIT_GAS = 750_000n
// Padding we add to simulation gas to ensure we specify enough
const SIMULATED_DEPOSIT_GAS_PADDING = 100_000n

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
          // these three will be passed in the shortcutTriggerArgs. It's a temporary workaround before we can directly extract these info from the tokenId
          positionAddress: ZodAddressLowerCased,
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

          const depositTx: Transaction = {
            networkId,
            from: walletAddress,
            to: positionAddress,
            data: encodeFunctionData({
              abi: vaultAbi,
              functionName: 'deposit',
              args: [amountToSupply],
            }),
          }

          transactions.push(depositTx)

          // TODO: consider moving this concern to the runtime
          try {
            const simulatedTransactions = await simulateTransactions({
              transactions,
              networkId,
            })
            const supplySimulatedTx =
              simulatedTransactions[simulatedTransactions.length - 1]

            depositTx.gas =
              BigInt(supplySimulatedTx.gasNeeded) +
              SIMULATED_DEPOSIT_GAS_PADDING
            depositTx.estimatedGasUse = BigInt(supplySimulatedTx.gasUsed)
          } catch (error) {
            if (!(error instanceof UnsupportedSimulateRequest)) {
              logger.warn(error, 'Unexpected error during simulateTransactions')
            }
            depositTx.gas = DEFAULT_DEPOSIT_GAS
            depositTx.estimatedGasUse = DEFAULT_DEPOSIT_GAS / 3n
          }

          return { transactions }
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
          // these two will be passed in the shortcutTriggerArgs.
          positionAddress: ZodAddressLowerCased,
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

          const withdrawTx: Transaction = tokens[0].useMax
            ? {
                networkId,
                from: walletAddress,
                to: positionAddress,
                data: encodeFunctionData({
                  abi: vaultAbi,
                  functionName: 'withdrawAll',
                  args: [],
                }),
              }
            : {
                networkId,
                from: walletAddress,
                to: positionAddress,
                data: encodeFunctionData({
                  abi: vaultAbi,
                  functionName: 'withdraw',
                  args: [amountToWithdraw],
                }),
              }

          transactions.push(withdrawTx)

          return { transactions }
        },
      }),
    ]
  },
}

export default hook
