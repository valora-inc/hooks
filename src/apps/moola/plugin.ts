import {
  AppPlugin,
  AppTokenPositionDefinition,
} from '../../plugin'
import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { erc20Abi } from '../../abis/erc-20'
import { DecimalNumber } from '../../numbers'
import BigNumber from 'bignumber.js'
import { DebtTokenDefinition, MOOLA_DEBT_TOKENS } from './debtTokens'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

function getAppTokenPositionDefinition(
  debtTokenDefinition: DebtTokenDefinition,
  network: string,
): AppTokenPositionDefinition {
  return {
    type: 'app-token-definition',
    network: network,
    address: debtTokenDefinition.debtTokenAddress,
    tokens: [{ address: debtTokenDefinition.baseTokenAddress, network }],
    displayProps: {
      title: debtTokenDefinition.title,
      description: debtTokenDefinition.description,
      imageUrl: debtTokenDefinition.imageUrl, // Provide an image URL for the debt token
    },
    pricePerShare: [new BigNumber(-1) as DecimalNumber],
  }
}

const plugin: AppPlugin = {
  getInfo() {
    return {
      id: 'moola',
      name: 'Moola',
      description: 'Moola debt tokens',
    }
  },
  async getPositionDefinitions(network, address) {
    const debtTokenBalances = await client.multicall({
      contracts: MOOLA_DEBT_TOKENS.map(({ debtTokenAddress }) => ({
        address: debtTokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      })),
      allowFailure: false,
    })

    return MOOLA_DEBT_TOKENS
      .filter((_, i) => debtTokenBalances[i])
      .map((debtTokenDefinition) =>
        getAppTokenPositionDefinition(
          debtTokenDefinition,
          network
        ),
      )
  },
  getAppTokenDefinition(_) {
    // We don't need this for now, since there are no intermediary tokens
    throw new Error('Not implemented')
  },
}

export default plugin
