import { Address } from './address'

export interface SwapTransaction {
  swapType: 'same-chain' // only supporting same-chain swaps for now
  chainId: number
  buyAmount: string
  sellAmount: string
  buyTokenAddress: string
  sellTokenAddress: string
  // be careful -- price means different things when using sellAmount vs buyAmount
  price: string
  guaranteedPrice: string
  appFeePercentageIncludedInPrice: string | undefined
  /**
   * In percentage, between 0 and 100
   */
  estimatedPriceImpact: string | null
  gas: string
  estimatedGasUse: string | null | undefined
  to: Address
  value: string
  data: `0x${string}`
  from: Address
  allowanceTarget: Address
}
