import got from '../../utils/got'
import { Address } from 'viem'
import { NetworkId } from '../../types/networkId'

export type BeefyVault = {
  id: string
  name: string
  type: string // cowcentrated, gov
  token: string
  tokenAddress: Address | undefined
  tokenDecimals: number
  tokenProviderId: string
  earnedToken: string
  earnContractAddress: Address
  status: string
  platformId: string
  assets: string[]
  risks: string[]
  strategyTypeId: string
  network: string
  chain: string
  zaps: any[]
  isGovVault: boolean
  oracle: string
  oracleId: string
  createdAt: number
}

export type BaseBeefyVault = BeefyVault & {
  earnedTokenAddress: Address
  depositTokenAddresses: string[]
  strategy: Address
  pricePerFullShare: string
}

export type GovVault = BeefyVault & {
  type: 'gov'
  isGovVault: true
  earnedTokenAddress: Address[]
}

export const NETWORK_ID_TO_BEEFY_BLOCKCHAIN_ID: Record<
  NetworkId,
  string | null
> = {
  [NetworkId['celo-mainnet']]: 'celo',
  [NetworkId['ethereum-mainnet']]: 'ethereum',
  [NetworkId['arbitrum-one']]: 'arbitrum',
  [NetworkId['op-mainnet']]: 'optimism',
  [NetworkId['polygon-pos-mainnet']]: 'polygon',
  [NetworkId['base-mainnet']]: 'base',
  [NetworkId['celo-alfajores']]: null,
  [NetworkId['ethereum-sepolia']]: null,
  [NetworkId['arbitrum-sepolia']]: null,
  [NetworkId['op-sepolia']]: null,
  [NetworkId['polygon-pos-amoy']]: null,
  [NetworkId['base-sepolia']]: null,
}

const NETWORK_ID_TO_CHAIN_ID: {
  [networkId in NetworkId]: number
} = {
  [NetworkId['ethereum-mainnet']]: 1,
  [NetworkId['arbitrum-one']]: 42161,
  [NetworkId['op-mainnet']]: 10,
  [NetworkId['celo-mainnet']]: 42220,
  [NetworkId['polygon-pos-mainnet']]: 137,
  [NetworkId['base-mainnet']]: 8453,
  [NetworkId['ethereum-sepolia']]: 11155111,
  [NetworkId['arbitrum-sepolia']]: 421614,
  [NetworkId['op-sepolia']]: 11155420,
  [NetworkId['celo-alfajores']]: 44787,
  [NetworkId['polygon-pos-amoy']]: 80002,
  [NetworkId['base-sepolia']]: 84532,
}

export async function getBeefyVaults(
  networkId: NetworkId,
): Promise<{ vaults: BaseBeefyVault[]; govVaults: GovVault[] }> {
  const [vaults, govVaults] = await Promise.all([
    got
      .get(
        `https://api.beefy.finance/harvestable-vaults/${NETWORK_ID_TO_BEEFY_BLOCKCHAIN_ID[networkId]}`,
      )
      .json<BaseBeefyVault[]>(),
    got
      .get(
        `https://api.beefy.finance/gov-vaults/${NETWORK_ID_TO_BEEFY_BLOCKCHAIN_ID[networkId]}`,
      )
      .json<GovVault[]>(),
  ])

  return {
    vaults,
    govVaults,
  }
}

export async function getBeefyPrices(
  networkId: NetworkId,
): Promise<Record<string, number | undefined>> {
  const [lpsPrices, tokenPrices, tokens] = await Promise.all([
    got
      .get(`https://api.beefy.finance/lps`)
      .json<Record<string, number | undefined>>(),
    got
      .get(`https://api.beefy.finance/prices`)
      .json<Record<string, number | undefined>>(),
    got
      .get(
        `https://api.beefy.finance/tokens/${NETWORK_ID_TO_BEEFY_BLOCKCHAIN_ID[networkId]}`,
      )
      .json<
        Record<
          string, // oracleId
          {
            // These are the fields we need, but there are more
            address: string
            oracle: string // examples: 'lps', 'tokens'
            oracleId: string
          }
        >
      >(),
  ])

  // Combine lps prices with token prices
  return {
    ...lpsPrices,
    ...Object.fromEntries(
      Object.entries(tokens)
        .filter(([, { oracle }]) => oracle === 'tokens')
        .map(([, { address, oracleId }]) => [
          address.toLowerCase(),
          tokenPrices[oracleId],
        ]),
    ),
  }
}

export async function getApys() {
  return got
    .get(`https://api.beefy.finance/apy/`)
    .json<Record<string, number | undefined>>()
}

export async function getTvls(
  networkId: NetworkId,
): Promise<Record<string, number | undefined>> {
  const tvlResponse = await got
    .get(`https://api.beefy.finance/tvl/`)
    .json<Record<number, Record<string, number | undefined>>>()
  return tvlResponse[NETWORK_ID_TO_CHAIN_ID[networkId]] ?? {}
}
