import {
  PositionsHook,
  AppTokenPositionDefinition,
  UnknownAppTokenError,
  TokenDefinition,
  ContractPositionDefinition,
} from '../../types/positions'
import { Address } from 'viem'
import { DecimalNumber, toDecimalNumber } from '../../types/numbers'
import BigNumber from 'bignumber.js'
import { getClient } from '../../runtime/client'
import { getTokenId } from '../../runtime/getTokenId'
import { getAllBridgeTokenInfo } from './api'
import { poolAbi } from './abis/pool'

const ALLBRIDGE_LOGO = '???'  // TODO: Add actual logo link

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'allbridge',
      name: 'Allbridge',
      description: '',
    }
  },
  async getPositionDefinitions(networkId, address) {
    const allbridgeTokenInfo = (await getAllBridgeTokenInfo({ networkId }))
      .tokens

    return allbridgeTokenInfo.flatMap(async (tokenInfo) => {
      const apr = new BigNumber(tokenInfo.apr7d).toNumber()

      const client = getClient(networkId)
      const balanceOf = await client.readContract({
        address: tokenInfo.poolAddress,
        abi: poolAbi,
        functionName: 'balanceOf',
        args: [address as Address],
      })
      const pendingReward = await client.readContract({
        address: tokenInfo.poolAddress,
        abi: poolAbi,
        functionName: 'pendingReward',
        args: [address as Address],
      })

      const useAToken = balanceOf > 0 || !balanceOf
      const showReward = pendingReward > 0
      return [
        useAToken &&
          ({
            type: 'app-token-definition',
            networkId,
            address: ''.toLowerCase(), // TODO: Add LP token address here
            tokens: [
              { address: tokenInfo.tokenAddress.toLowerCase(), networkId },
            ],
            availableShortcutIds: ['deposit', 'withdraw'],
            displayProps: {
              title: tokenInfo.symbol,
              description: `Supplied (APR: ${apr.toFixed(2)}%)`,
              imageUrl: ALLBRIDGE_LOGO,
            },
            dataProps: {
              apy: apr,
              depositTokenId: getTokenId({
                networkId,
                address: tokenInfo.tokenAddress.toLowerCase(),
              }),
              withdrawTokenId: getTokenId({
                networkId,
                address: ''.toLowerCase(), // TODO: Add LP token address here
              }),
            },
            pricePerShare: [new BigNumber(1) as DecimalNumber],
          } satisfies AppTokenPositionDefinition),
        showReward &&
          ({
            type: 'contract-position-definition',
            networkId,
            address: ''.toLowerCase(), // TODO: Add LP token address here
            extraId: 'supply-incentives',
            tokens: [{
              address: tokenInfo.tokenAddress.toLowerCase(),
              networkId,
              category: 'claimable',
            }],
            availableShortcutIds: ['claim-rewards'],
            balances: [toDecimalNumber(pendingReward, tokenInfo.decimals)],
            displayProps: {
              title: `${tokenInfo.symbol} supply incentives`,
              description: 'Rewards for supplying',
              imageUrl: ALLBRIDGE_LOGO,
            },
          } satisfies ContractPositionDefinition),
      ]
    })
  },
  async getAppTokenDefinition({ networkId, address }: TokenDefinition) {
    throw new UnknownAppTokenError({ networkId, address })
  },
}

export default hook