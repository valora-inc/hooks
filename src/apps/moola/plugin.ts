import {
  AppPlugin,
  AppTokenPositionDefinition,
  TokenDefinition,
} from '../../plugin'
import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { erc20Abi } from '../../abis/erc-20'
import { DecimalNumber } from '../../numbers'
import BigNumber from 'bignumber.js'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

interface DebtTokensInfo {
  tokenAddress: Address
  debtTokenAddress: Address
  imageUrl: string
  title: string
  description: string
}

// Example config with token addresses and corresponding debt token addresses
const debtTokensInfo: DebtTokensInfo[] = [
  {
    tokenAddress: '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73',
    debtTokenAddress: '0xfb6c830c13d8322b31b282ef1fe85cbb669d9ae8',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/mcEUR.png',
    description: 'Moola variable debt',
    title: 'cEUR debt',
  },
  {
    tokenAddress: '0x765de816845861e75a25fca122bb6898b8b1282a',
    debtTokenAddress: '0xf602d9617564c07f1e128687798d8c699ced3961',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/mcUSD.png',
    description: 'Moola variable debt',
    title: 'cUSD debt',
  },
  {
    tokenAddress: '0xe8537a3d056da446677b9e9d6c5db704eaab4787',
    debtTokenAddress: '0xbd408042909351B649DC50353532dEeF6De9fAA9',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/mcREAL.png',
    description: 'Moola variable debt',
    title: 'cREAL debt',
  },
  {
    tokenAddress: '0x471ece3750da237f93b8e339c536989b8978a438',
    debtTokenAddress: '0xaf451d23d6f0fa680113ce2d27a891aa3587f0c3',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/mCELO.png',
    description: 'Moola variable debt',
    title: 'CELO debt',
  },
  {
    tokenAddress: '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73',
    debtTokenAddress: '0x612599d8421f36b7da4ddba201a3854ff55e3d03',
    imageUrl: '',
    description: 'Moola stable debt',
    title: 'cEUR debt',
  },
  {
    tokenAddress: '0x765de816845861e75a25fca122bb6898b8b1282a',
    debtTokenAddress: '0xa9f50d9f7c03e8b48b2415218008822ea3334adb',
    imageUrl: '',
    description: 'Moola stable debt',
    title: 'cUSD debt',
  },
  {
    tokenAddress: '0xe8537a3d056da446677b9e9d6c5db704eaab4787',
    debtTokenAddress: '0x0d00d9a02b85e9274f60a082609f44f7c57f373d',
    imageUrl: '',
    description: 'Moola stable debt',
    title: 'cREAL debt',
  },
  {
    tokenAddress: '0x471ece3750da237f93b8e339c536989b8978a438',
    debtTokenAddress: '0x02661dd90c6243fe5cdf88de3e8cb74bcc3bd25e',
    imageUrl: '',
    description: 'Moola stable debt',
    title: 'CELO debt',
  },
  // Add more token-debt pairs here
]

function getTokenDefinitionFromInfo(
  tokenDefinition: TokenDefinition,
  debtTokenInfo: DebtTokensInfo,
): AppTokenPositionDefinition {
  return {
    type: 'app-token-definition',
    network: tokenDefinition.network,
    address: debtTokenInfo.debtTokenAddress,
    tokens: [tokenDefinition],
    displayProps: {
      title: debtTokenInfo.title,
      description: debtTokenInfo.description,
      imageUrl: debtTokenInfo.imageUrl, // Provide an image URL for the debt token
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
      contracts: debtTokensInfo.map(({ debtTokenAddress }) => ({
        address: debtTokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      })),
      allowFailure: false,
    })

    return debtTokensInfo
      .filter((_, i) => debtTokenBalances[i])
      .map((debtTokenInfo) =>
        getTokenDefinitionFromInfo(
          { address: debtTokenInfo.tokenAddress, network },
          debtTokenInfo,
        ),
      )
  },
  getAppTokenDefinition(_) {
    // We don't need this for now, since there are no intermediary tokens
    throw new Error('Not implemented')
  },
}

export default plugin
