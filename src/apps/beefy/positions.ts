import { Address } from 'viem'
import { erc20Abi } from '../../abis/erc-20'
import { getClient } from '../../runtime/client'
import { NetworkId } from '../../types/networkId'
import { DecimalNumber, toDecimalNumber } from '../../types/numbers'
import {
  ContractPositionDefinition,
  PositionsHook,
  TokenDefinition,
  UnknownAppTokenError,
} from '../../types/positions'
import { createBatches } from '../../utils/batcher'
import { getUniswapV2PoolPositionDefinition } from '../ubeswap/positions'
import { BeefyV2AppMulticallAbi } from './abis/BeefyV2AppMulticallAbi'
import {
  BeefyVault,
  NETWORK_ID_TO_BEEFY_BLOCKCHAIN_ID,
  getAllBeefyVaults,
} from './api'

// Fetched addresses from https://github.com/beefyfinance/beefy-v2/blob/main/src/config/config.tsx
const BEEFY_MULTICALL_ADDRESS: {
  [networkId: string]: Address | undefined
} = {
  [NetworkId['ethereum-mainnet']]: '0x00d3e26d17aEA6f5c7d2f442aAc68E679E454517',
  [NetworkId['arbitrum-one']]: '0x47bec05dC291e61cd4360322eA44882cA468dD54',
  [NetworkId['op-mainnet']]: '0xB089f6c9C99238FC6df256cc66d53Aed198584D9',
  [NetworkId['celo-mainnet']]: '0x0bF5F48d8F761efAe0f187eCce60784e5d3E87E6',

  // polygon: 0x244908D9A21B143911D531cD1D37575D63da4D87
  // base: 0x09C74A4bd3453e1C15D6624F24b3A02059a4dA15
}

const BEEFY_VAULT_DECIMALS = 18

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
    for (const batch of batches) {
      if (batch.length === 0) {
        continue
      }
      const balances = await client.readContract({
        abi: BeefyV2AppMulticallAbi,
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
    }

    return userVaults.map(
      (vault): ContractPositionDefinition => ({
        type: 'contract-position-definition',
        networkId,
        address: vault.earnedTokenAddress.toLowerCase(),
        tokens: [
          {
            address: vault.tokenAddress.toLowerCase(),
            networkId,
          },
        ],
        displayProps: () => {
          return {
            title: vault.name,
            description: 'Vault',
            imageUrl:
              'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/beefy.png',
          }
        },
        balances: async () => {
          const decimals = await client.readContract({
            address: vault.tokenAddress,
            abi: erc20Abi,
            functionName: 'decimals',
          })
          return [
            toDecimalNumber(
              BigInt(vault.pricePerFullShare),
              BEEFY_VAULT_DECIMALS,
            ).times(
              toDecimalNumber(BigInt(vault.balance), decimals),
            ) as DecimalNumber,
          ]
        },
      }),
    )
  },
  async getAppTokenDefinition({ networkId, address }: TokenDefinition) {
    const vaults = await getAllBeefyVaults()

    const vault = vaults
      .filter((v) => v.chain === NETWORK_ID_TO_BEEFY_BLOCKCHAIN_ID[networkId])
      .find((v) => v.tokenAddress?.toLowerCase() === address)
    if (!vault || vault.strategyTypeId !== 'lp') {
      throw new UnknownAppTokenError({ networkId, address })
    }

    return getUniswapV2PoolPositionDefinition(networkId, address as Address)
  },
}

export default hook
