import {
  PositionsHook,
  AppTokenPositionDefinition,
} from '../../types/positions'
import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { erc20Abi } from '../../abis/erc-20'
import { DecimalNumber } from '../../types/numbers'
import BigNumber from 'bignumber.js'
import { DebtTokenDefinition, MOOLA_DEBT_TOKENS } from './debtTokens'
import { NetworkId } from '../../api/networkId'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

function getAppTokenPositionDefinition(
  debtTokenDefinition: DebtTokenDefinition,
  networkId: NetworkId,
): AppTokenPositionDefinition {
  return {
    type: 'app-token-definition',
    networkId,
    address: debtTokenDefinition.debtTokenAddress,
    tokens: [{ address: debtTokenDefinition.baseTokenAddress, networkId }],
    displayProps: {
      title: debtTokenDefinition.title,
      description: debtTokenDefinition.description,
      imageUrl: debtTokenDefinition.imageUrl, // Provide an image URL for the debt token
    },
    pricePerShare: [new BigNumber(-1) as DecimalNumber],
  }
}

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'moola',
      name: 'Moola',
      description: 'Moola debt tokens',
    }
  },
  async getPositionDefinitions(networkId, address) {
    if (
      networkId !== NetworkId['celo-mainnet']
    ) {
      // dapp is only on Celo, and implementation is hardcoded to Celo mainnet (contract addresses in particular)
      return []
    }
    const debtTokenBalances = await client.multicall({
      contracts: MOOLA_DEBT_TOKENS.map(({ debtTokenAddress }) => ({
        address: debtTokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      })),
      allowFailure: false,
    })

    return MOOLA_DEBT_TOKENS.filter((_, i) => debtTokenBalances[i]).map(
      (debtTokenDefinition) =>
        getAppTokenPositionDefinition(debtTokenDefinition, networkId),
    )
  },
}

export default hook
