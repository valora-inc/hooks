import { Address } from 'viem'
import { logger } from '../../log'
import { getClient } from '../../runtime/client'
import { getTokenId } from '../../runtime/getTokenId'
import { NetworkId } from '../../types/networkId'
import { toDecimalNumber, toSerializedDecimalNumber } from '../../types/numbers'
import {
  AppTokenPositionDefinition,
  ContractPositionDefinition,
  PositionsHook,
  TokenDefinition,
  UnknownAppTokenError,
} from '../../types/positions'
import { createBatches } from '../../utils/batcher'
import {
  beefyClmVaultsMulticallAbi,
  beefyClmVaultsMulticallBytecode,
} from './abis/beefy-clm-vaults-multicall'
import { beefyV2AppMulticallAbi } from './abis/beefy-v2-app-multicall'
import { BaseBeefyVault, GovVault, getBeefyPrices, getBeefyVaults } from './api'

type BeefyPrices = Awaited<ReturnType<typeof getBeefyPrices>>

// Fetched addresses from https://github.com/beefyfinance/beefy-v2/blob/main/src/config/config.tsx
const BEEFY_MULTICALL_ADDRESS: {
  [networkId in NetworkId]: Address | undefined
} = {
  [NetworkId['ethereum-mainnet']]: '0x00d3e26d17aEA6f5c7d2f442aAc68E679E454517',
  [NetworkId['arbitrum-one']]: '0x47bec05dC291e61cd4360322eA44882cA468dD54',
  [NetworkId['op-mainnet']]: '0xB089f6c9C99238FC6df256cc66d53Aed198584D9',
  [NetworkId['celo-mainnet']]: '0x0bF5F48d8F761efAe0f187eCce60784e5d3E87E6',
  [NetworkId['polygon-pos-mainnet']]:
    '0x244908D9A21B143911D531cD1D37575D63da4D87',
  [NetworkId['base-mainnet']]: '0x57B01298DfDdeA1c6CaB01793396af5fbFc213CE',
  [NetworkId['ethereum-sepolia']]: undefined,
  [NetworkId['arbitrum-sepolia']]: undefined,
  [NetworkId['op-sepolia']]: undefined,
  [NetworkId['celo-alfajores']]: undefined,
  [NetworkId['polygon-pos-amoy']]: undefined,
  [NetworkId['base-sepolia']]: undefined,
}

const beefyAppTokenDefinition = (
  networkId: NetworkId,
  vault: BaseBeefyVault,
  prices: BeefyPrices,
): AppTokenPositionDefinition => {
  const priceUsd = prices[vault.id]
  return {
    type: 'app-token-definition',
    networkId,
    address: vault.earnedTokenAddress.toLowerCase(),
    tokens: [
      {
        address: vault.tokenAddress?.toLowerCase(),
        networkId,
        fallbackPriceUsd: priceUsd
          ? toSerializedDecimalNumber(priceUsd)
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
  }
}

// CLM = Cowcentrated Liquidity Manager: https://docs.beefy.finance/beefy-products/clm
interface ClmVaultBalanceInfo {
  token0: Address
  token1: Address
  amount0: bigint
  amount1: bigint
}

const beefyConcentratedContractDefinition = (
  networkId: NetworkId,
  vault: BaseBeefyVault,
  balanceInfo: ClmVaultBalanceInfo | undefined,
  description: string,
  prices: BeefyPrices,
): ContractPositionDefinition | null => {
  if (!balanceInfo) {
    return null
  }

  return {
    type: 'contract-position-definition',
    networkId,
    address: vault.earnedTokenAddress.toLowerCase(),
    tokens: vault.depositTokenAddresses.map((address) => {
      const addressLower = address.toLowerCase()
      const priceUsd = prices[addressLower]
      return {
        address: addressLower,
        networkId,
        fallbackPriceUsd: priceUsd
          ? toSerializedDecimalNumber(priceUsd)
          : undefined,
      }
    }),
    displayProps: () => {
      return {
        title: vault.name + (vault.status === 'eol' ? ' (Retired)' : ''),
        description,
        imageUrl:
          'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/beefy.png',
      }
    },
    balances: async ({ resolvedTokensByTokenId }) => {
      const token0Decimals =
        resolvedTokensByTokenId[
          getTokenId({
            networkId,
            address: balanceInfo.token0,
          })
        ].decimals
      const token1Decimals =
        resolvedTokensByTokenId[
          getTokenId({
            networkId,
            address: balanceInfo.token1,
          })
        ].decimals
      return [
        toDecimalNumber(balanceInfo.amount0, token0Decimals),
        toDecimalNumber(balanceInfo.amount1, token1Decimals),
      ]
    },
  }
}

const beefyBaseVaultsPositions = async (
  networkId: NetworkId,
  address: Address,
  vaults: BaseBeefyVault[],
  multicallAddress: Address,
  prices: BeefyPrices,
) => {
  const client = getClient(networkId)

  const userVaults: (BaseBeefyVault & { balance: bigint })[] = []

  await Promise.all(
    createBatches(vaults).map(async (batch) => {
      if (batch.length === 0) {
        return
      }
      const balances = await client.readContract({
        abi: beefyV2AppMulticallAbi,
        address: multicallAddress,
        functionName: 'getTokenBalances',
        args: [batch.map((vault) => vault.earnContractAddress), address],
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

  const clmVaults = userVaults.filter((vault) => vault.type === 'cowcentrated')
  const info =
    clmVaults.length === 0
      ? []
      : await client.readContract({
          code: beefyClmVaultsMulticallBytecode,
          abi: beefyClmVaultsMulticallAbi,
          functionName: 'getUserVaults',
          args: [address, clmVaults.map((vault) => vault.earnContractAddress)],
        })
  return userVaults
    .map((vault) => {
      try {
        return vault.type === 'cowcentrated'
          ? beefyConcentratedContractDefinition(
              networkId,
              vault,
              info.find(
                (i) =>
                  i.token0 === vault.depositTokenAddresses[0] &&
                  i.token1 === vault.depositTokenAddresses[1],
              ),
              'CLM Vault',
              prices,
            )
          : beefyAppTokenDefinition(networkId, vault, prices)
      } catch (error) {
        logger.error('Error processing vault', vault, error)
        return null
      }
    })
    .filter((position): position is ContractPositionDefinition => !!position)
}

const beefyGovVaultsPositions = async (
  networkId: NetworkId,
  address: Address,
  vaults: BaseBeefyVault[],
  govVaults: GovVault[],
  multicallAddress: Address,
  prices: BeefyPrices,
) => {
  const client = getClient(networkId)

  const userVaults: (GovVault & { balance: bigint })[] = []

  await Promise.all(
    createBatches(govVaults).map(async (batch) => {
      if (batch.length === 0) {
        return
      }
      const balances = await client.readContract({
        abi: beefyV2AppMulticallAbi,
        address: multicallAddress,
        functionName: 'getTokenBalances',
        args: [batch.map((vault) => vault.earnContractAddress), address],
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

  const clmVaults = userVaults
    .map((vault) => ({
      userVault: vault,
      vault: vaults.find(
        (v) =>
          v.earnContractAddress === vault.tokenAddress &&
          v.type === 'cowcentrated',
      ),
    }))
    .filter((v) => v.vault !== undefined)
  if (clmVaults.length !== userVaults.length) {
    logger.error(
      'clmVaults.length !== userVaults.length some gov vaults are not being processed',
    )
  }
  if (clmVaults.length === 0) {
    return []
  }
  const info = await client.readContract({
    code: beefyClmVaultsMulticallBytecode,
    abi: beefyClmVaultsMulticallAbi,
    functionName: 'getUserClmPools',
    args: [
      address,
      clmVaults.map(({ userVault }) => userVault.tokenAddress),
      clmVaults.map(({ userVault }) => userVault.earnContractAddress),
    ],
  })

  return clmVaults
    .map(({ vault }) =>
      beefyConcentratedContractDefinition(
        networkId,
        vault!,
        info.find(
          (i) =>
            i.token0 === vault!.depositTokenAddresses[0] &&
            i.token1 === vault!.depositTokenAddresses[1],
        ),
        'CLM Pool',
        prices,
      ),
    )
    .filter((position): position is ContractPositionDefinition => !!position)
}

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'beefy',
      name: 'Beefy',
      description: 'Beefy vaults',
    }
  },
  async getPositionDefinitions({ networkId, address }) {
    const multicallAddress = BEEFY_MULTICALL_ADDRESS[networkId]
    if (!multicallAddress) {
      return []
    }

    const [{ vaults, govVaults }, prices] = await Promise.all([
      getBeefyVaults(networkId),
      getBeefyPrices(networkId),
    ])

    return [
      ...(await beefyBaseVaultsPositions(
        networkId,
        address as Address,
        vaults,
        multicallAddress,
        prices,
      )),
      ...(await beefyGovVaultsPositions(
        networkId,
        address as Address,
        vaults,
        govVaults,
        multicallAddress,
        prices,
      )),
    ]
  },
  async getAppTokenDefinition({ networkId, address }: TokenDefinition) {
    throw new UnknownAppTokenError({ networkId, address })
  },
}

export default hook
