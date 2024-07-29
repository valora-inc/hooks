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
  
  const ALLBRIDGE_LOGO = '???'
  
  const hook: PositionsHook = {
    getInfo() {
      return {
        id: 'allbridge',
        name: 'Allbridge',
        description: '',
      }
    },
    async getPositionDefinitions(networkId, address) {
      const allbridgeTokenInfo = (await getAllBridgeTokenInfo({networkId})).tokens

      return allbridgeTokenInfo.flatMap(async (tokenInfo) => {
        const apr = (new BigNumber(tokenInfo.apr7d)).toNumber()

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
      })
    },
    async getAppTokenDefinition({ networkId, address }: TokenDefinition) {
      throw new UnknownAppTokenError({ networkId, address })
    },
  }
  
  export default hook
  