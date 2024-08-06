import got from 'got'
import { NetworkId } from '../../types/networkId'
import { Address } from 'viem'

type SupportedAllbridgeChainSymbols =
  | 'ETH'
  | 'CEL'
  | 'POL'
  | 'ARB'
  | 'OPT'
  | 'BAS'

const NETWORK_ID_TO_ALLBRIDGE_BLOCKCHAIN_SYMBOL: Record<
  NetworkId,
  SupportedAllbridgeChainSymbols
> = {
  [NetworkId['ethereum-mainnet']]: 'ETH',
  [NetworkId['ethereum-sepolia']]: 'ETH',
  [NetworkId['celo-mainnet']]: 'CEL',
  [NetworkId['celo-alfajores']]: 'CEL',
  [NetworkId['polygon-pos-mainnet']]: 'POL',
  [NetworkId['polygon-pos-amoy']]: 'POL',
  [NetworkId['arbitrum-one']]: 'ARB',
  [NetworkId['arbitrum-sepolia']]: 'ARB',
  [NetworkId['op-mainnet']]: 'OPT',
  [NetworkId['op-sepolia']]: 'OPT',
  [NetworkId['base-mainnet']]: 'BAS',
  [NetworkId['base-sepolia']]: 'BAS',
}

type AllbridgeApiResponse = {
  [key in SupportedAllbridgeChainSymbols]: NetworkInfo
}

interface TokenInfo {
  name: string
  poolAddress: Address
  tokenAddress: Address
  decimals: number
  symbol: string
  poolInfo: PoolInfo
  feeShare: string
  apr: string
  apr7d: string
  apr30d: string
  lpRate: string
}

interface PoolInfo {
  aValue: string
  dValue: string
  tokenBalance: string
  vUsdBalance: string
  totalLpAmount: string
  accRewardPerShareP: string
  p: number
}

interface TransferTime {
  allbridge: number
  wormhole: number
  cctp: number | null
}

interface TxCostAmount {
  swap: string
  transfer: string
  maxAmount: string
}

interface NetworkInfo {
  tokens: TokenInfo[]
  chainId: number
  bridgeAddress: Address
  swapAddress: Address
  transferTime: Record<SupportedAllbridgeChainSymbols, TransferTime>
  confirmations: number
  txCostAmount: TxCostAmount
}

export async function getAllbridgeTokenInfo({
  networkId,
}: {
  networkId: NetworkId
}): Promise<NetworkInfo> {
  const allbridgeTokensInfoResponse: AllbridgeApiResponse = await got
    .get('https://core.api.allbridgecoreapi.net/token-info')
    .json()

  return allbridgeTokensInfoResponse[
    NETWORK_ID_TO_ALLBRIDGE_BLOCKCHAIN_SYMBOL[networkId]
  ]
}
