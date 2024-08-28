import { Address, encodeFunctionData, parseUnits, erc20Abi } from 'viem'
import {
  createShortcut,
  ShortcutsHook,
  tokenAmounts,
  Transaction,
} from '../../types/shortcuts'
import { NetworkId } from '../../types/networkId'
import { ZodAddressLowerCased } from '../../types/address'
import { z } from 'zod'
import { getClient } from '../../runtime/client'
import { poolV3Abi } from './abis/pool-v3'
import { aTokenAbi } from './abis/atoken'
import { AAVE_V3_ADDRESSES_BY_NETWORK_ID } from './constants'
import { incentivesControllerV3Abi } from './abis/incentives-controller-v3'

// Hardcoding for now
const GAS = 1_000_000n

const hook: ShortcutsHook = {
  async getShortcutDefinitions(networkId: NetworkId, _address?: string) {
    const aaveAddresses = AAVE_V3_ADDRESSES_BY_NETWORK_ID[networkId]
    if (!aaveAddresses) {
      return []
    }

    const poolContractAddress = aaveAddresses.pool
    const incentivesContractAddress = aaveAddresses.incentivesController

    return [
      createShortcut({
        id: 'deposit',
        name: 'Deposit',
        description: 'Lend your assets to earn interest',
        networkIds: [networkId],
        category: 'deposit',
        triggerInputShape: {
          tokens: tokenAmounts.length(1),
          // these two will be passed in the shortcutTriggerArgs. It's a temporary workaround before we can directly extract these info from the tokenId
          tokenAddress: ZodAddressLowerCased,
          tokenDecimals: z.coerce.number(),
        },
        async onTrigger({
          networkId,
          address,
          tokens,
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
              to: tokenAddress,
              data,
            }
            transactions.push(approveTx)
          }

          const supplyTx: Transaction = {
            networkId,
            from: walletAddress,
            to: poolContractAddress,
            data: encodeFunctionData({
              abi: poolV3Abi,
              functionName: 'supply',
              args: [tokenAddress, amountToSupply, walletAddress, 0],
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
          // token must be the A token
          tokens: tokenAmounts.length(1),
          // these two will be passed in the shortcutTriggerArgs. It's a temporary workaround before we can directly extract these info from the tokenId
          tokenAddress: ZodAddressLowerCased,
          tokenDecimals: z.coerce.number(),
        },
        async onTrigger({
          networkId,
          address,
          tokens,
          tokenAddress,
          tokenDecimals,
        }) {
          const walletAddress = address as Address
          const transactions: Transaction[] = []

          // amount in smallest unit
          const amountToWithdraw = parseUnits(tokens[0].amount, tokenDecimals)

          const client = getClient(networkId)

          const underlyingAssetAddress = await client.readContract({
            address: tokenAddress,
            abi: aTokenAbi,
            functionName: 'UNDERLYING_ASSET_ADDRESS',
          })

          const withdrawTx: Transaction = {
            networkId,
            from: walletAddress,
            to: poolContractAddress,
            data: encodeFunctionData({
              abi: poolV3Abi,
              functionName: 'withdraw',
              args: [underlyingAssetAddress, amountToWithdraw, walletAddress],
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

          return [
            {
              networkId,
              from: walletAddress,
              to: incentivesContractAddress,
              data: encodeFunctionData({
                abi: incentivesControllerV3Abi,
                functionName: 'claimAllRewardsToSelf',
                args: [[positionAddress]], // positionAddress is the a/v/sToken address
              }),
            },
          ]
        },
      }),
    ]
  },
}

export default hook
