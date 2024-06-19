import { Address } from 'viem'
import { getClient } from '../../runtime/client'
import { getTokenId } from '../../runtime/getTokenId'
import { NetworkId } from '../../types/networkId'
import { toDecimalNumber, toSerializedDecimalNumber } from '../../types/numbers'
import {
  AppTokenPositionDefinition,
  PositionsHook,
  TokenDefinition,
  UnknownAppTokenError,
} from '../../types/positions'
import { createBatches } from '../../utils/batcher'
import { beefyV2AppMulticallAbi } from './abis/beefy-v2-app-multicall'
import {
  BeefyVault,
  NETWORK_ID_TO_BEEFY_BLOCKCHAIN_ID,
  getAllBeefyVaults,
  getBeefyLpsPrices,
} from './api'

// Fetched addresses from https://github.com/beefyfinance/beefy-v2/blob/main/src/config/config.tsx
const BEEFY_MULTICALL_ADDRESS: {
  [networkId in NetworkId]: Address | undefined
} = {
  [NetworkId['ethereum-mainnet']]: '0x00d3e26d17aEA6f5c7d2f442aAc68E679E454517',
  [NetworkId['arbitrum-one']]: '0x47bec05dC291e61cd4360322eA44882cA468dD54',
  [NetworkId['op-mainnet']]: '0xB089f6c9C99238FC6df256cc66d53Aed198584D9',
  [NetworkId['celo-mainnet']]: '0x0bF5F48d8F761efAe0f187eCce60784e5d3E87E6',

  // polygon: 0x244908D9A21B143911D531cD1D37575D63da4D87
  // base: 0x09C74A4bd3453e1C15D6624F24b3A02059a4dA15

  [NetworkId['ethereum-sepolia']]: undefined,
  [NetworkId['arbitrum-sepolia']]: undefined,
  [NetworkId['op-sepolia']]: undefined,
  [NetworkId['celo-alfajores']]: undefined,
}

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'beefy',
      name: 'Beefy',
      description: 'Beefy vaults',
    }
  },
  async getPositionDefinitions(networkId: NetworkId, address: Address) {
    const multicallAddress = BEEFY_MULTICALL_ADDRESS[networkId]
    if (!multicallAddress) {
      return []
    }
    const client = getClient(networkId)

    const vaults = await getAllBeefyVaults()
    const userVaults: (BeefyVault & { balance: bigint })[] = []

    const batches = createBatches(
      vaults.filter(
        (v) => v.chain === NETWORK_ID_TO_BEEFY_BLOCKCHAIN_ID[networkId],
      ),
    )

    await Promise.all(
      batches.map(async (batch) => {
        if (batch.length === 0) {
          return
        }
        const balances = await client.readContract({
          abi: beefyV2AppMulticallAbi,
          address: multicallAddress,
          functionName: 'getTokenBalances',
          args: [batch.map((vault) => vault.earnedTokenAddress), address],
        })
        for (let i = 0; i < balances.length; i++) {
          if (balances[i] > 0) {
            userVaults.push({
              ...batch[i],
              balance: balances[i],
            })
          }
        }
      }),
    )

    if (!userVaults.length) {
      return []
    }

    const prices = await getBeefyLpsPrices()

    return userVaults.map(
      (vault): AppTokenPositionDefinition => ({
        type: 'app-token-definition',
        networkId,
        address: vault.earnedTokenAddress.toLowerCase(),
        tokens: [
          {
            address: vault.tokenAddress.toLowerCase(),
            networkId,
            fallbackPriceUsd: prices[vault.id]
              ? toSerializedDecimalNumber(prices[vault.id])
              : undefined,
          },
        ],
        displayProps: () => {
          return {
            title: vault.name + (vault.status === 'eol' ? ' (Retired)' : ''),
            description: 'Vault',
            imageUrl:
              'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/beefy.png',
          }
        },
        pricePerShare: async ({ tokensByTokenId }) => {
          const tokenId = getTokenId({
            address: vault.tokenAddress,
            networkId,
          })
          const { decimals } = tokensByTokenId[tokenId]
          return [toDecimalNumber(BigInt(vault.pricePerFullShare), decimals)]
        },
      }),
    )
  },
  async getAppTokenDefinition({ networkId, address }: TokenDefinition) {
    throw new UnknownAppTokenError({ networkId, address })
  },
}

export default hook
