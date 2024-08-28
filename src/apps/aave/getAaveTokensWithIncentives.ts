import { Address } from 'viem'

interface IncentiveData {
  readonly tokenAddress: Address
  readonly rewardsTokenInformation: readonly any[]
}

// Just a subset of the actual data
interface ReserveIncentivesData {
  readonly aIncentiveData: IncentiveData
  readonly vIncentiveData: IncentiveData
  readonly sIncentiveData: IncentiveData
}

export function getAaveTokensWithIncentives(
  reservesIncentiveData: readonly ReserveIncentivesData[],
): Address[] {
  return reservesIncentiveData
    .map(({ aIncentiveData, vIncentiveData, sIncentiveData }) => {
      const assetsWithRewards: Address[] = []
      if (aIncentiveData.rewardsTokenInformation.length) {
        assetsWithRewards.push(aIncentiveData.tokenAddress)
      }
      if (vIncentiveData.rewardsTokenInformation.length) {
        assetsWithRewards.push(vIncentiveData.tokenAddress)
      }
      if (sIncentiveData.rewardsTokenInformation.length) {
        assetsWithRewards.push(sIncentiveData.tokenAddress)
      }
      return assetsWithRewards
    })
    .flat()
}
