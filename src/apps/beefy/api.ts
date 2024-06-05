import got from 'got'
import { Address } from 'viem'
import { NetworkId } from '../../types/networkId'

export interface BeefyVault {
  id: string
  name: string
  type: string
  token: string
  tokenAddress: Address
  tokenDecimals: number
  tokenProviderId: string
  earnedToken: string
  earnedTokenAddress: Address
  earnContractAddress: Address
  status: string
  assets: string[]
  risks: string[]
  strategyTypeId: string
  network: string
  chain: string
  zaps: any[]
  isGovVault: boolean
  strategy: Address
  pricePerFullShare: string
}

export const NETWORK_ID_TO_BEEFY_BLOCKCHAIN_ID: Record<
  NetworkId,
  string | null
> = {
  [NetworkId['celo-mainnet']]: 'celo',
  [NetworkId['ethereum-mainnet']]: 'ethereum',
  [NetworkId['arbitrum-one']]: 'arbitrum',
  [NetworkId['op-mainnet']]: 'optimism',
  [NetworkId['ethereum-sepolia']]: null,
  [NetworkId['arbitrum-sepolia']]: null,
  [NetworkId['op-sepolia']]: null,
  [NetworkId['celo-alfajores']]: null,
}

export async function getAllBeefyVaults(): Promise<BeefyVault[]> {
  const vaults = await got
    .get(`https://api.beefy.finance/vaults`)
    .json<BeefyVault[]>()

  return vaults.filter(
    (v) =>
      v.chain !== null &&
      Object.values(NETWORK_ID_TO_BEEFY_BLOCKCHAIN_ID).includes(v.chain),
  )
}
