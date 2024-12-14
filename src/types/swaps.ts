import { Address } from './address'

export type SwapTransaction =
  | SameChainSwapTransaction
  | CrossChainSwapTransaction

interface SameChainSwapTransaction extends BaseSwapTransaction {
  swapType: 'same-chain'
}

interface CrossChainSwapTransaction extends BaseSwapTransaction {
  swapType: 'cross-chain'
  // Swap duration estimation in seconds
  estimatedDuration: number
  maxCrossChainFee: string
  estimatedCrossChainFee: string
}

interface BaseSwapTransaction {
  swapType: 'same-chain' | 'cross-chain'
  chainId: number
  buyAmount: string
  sellAmount: string
  buyTokenAddress: Address
  sellTokenAddress: Address
  price: string
  guaranteedPrice: string
  appFeePercentageIncludedInPrice?: string
  estimatedPriceImpact: string | null
  gas: string
  gasPrice: string
  to: string
  value: string // Needed for native asset swaps
  data: string
  from: string
  allowanceTarget: Address
  estimatedGasUse: string
  simulationStatus?: 'success' | 'failure'
}
