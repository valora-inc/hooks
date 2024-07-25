import got from 'got'
import { NetworkId } from '../../types/networkId'
import { Address } from 'viem'

type SupportedAllBridgeChainSymbols =
  | 'ETH'
  | 'CEL'
  | 'POL'
  | 'ARB'
  | 'OPT'
  | 'BAS'

const ALLBRIDGE_BLOCKCHAIN_SYMBOL_TO_NETWORK_ID: Record<
  SupportedAllBridgeChainSymbols,
  NetworkId
> = {
  ETH: NetworkId['ethereum-mainnet'],
  CEL: NetworkId['celo-mainnet'],
  POL: NetworkId['polygon-pos-mainnet'],
  ARB: NetworkId['arbitrum-one'],
  OPT: NetworkId['op-mainnet'],
  BAS: NetworkId['base-mainnet'],
}

type AllBridgeApiResponse = {
  [key in SupportedAllBridgeChainSymbols]: NetworkInfo
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
  transferTime: Record<SupportedAllBridgeChainSymbols, TransferTime>
  confirmations: number
  txCostAmount: TxCostAmount
}

export async function getAllBridgeTokenInfo({
  networkId,
}: {
  networkId: NetworkId
}): Promise<NetworkInfo> {
  const tokenObj: Record<string, NetworkInfo> = {}
  const tokenInfo: AllBridgeApiResponse = await got
    .get('https://core.api.allbridgecoreapi.net/token-info')
    .json()

  for (const key of Object.keys(
    tokenInfo,
  ) as SupportedAllBridgeChainSymbols[]) {
    if (!ALLBRIDGE_BLOCKCHAIN_SYMBOL_TO_NETWORK_ID[key]) continue
    tokenObj[ALLBRIDGE_BLOCKCHAIN_SYMBOL_TO_NETWORK_ID[key]] = tokenInfo[
      key
    ] as NetworkInfo
  }

  return tokenObj[networkId]
}
