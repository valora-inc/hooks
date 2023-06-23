import { Address } from 'viem'

export interface DebtTokenDefinition {
  baseTokenAddress: Address
  debtTokenAddress: Address
  imageUrl: string
  title: string
  description: string
}

export const MOOLA_DEBT_TOKENS: DebtTokenDefinition[] = [
  {
    baseTokenAddress: '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73',
    debtTokenAddress: '0xfb6c830c13d8322b31b282ef1fe85cbb669d9ae8',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
    description: 'Moola variable debt',
    title: 'cEUR debt',
  },
  {
    baseTokenAddress: '0x765de816845861e75a25fca122bb6898b8b1282a',
    debtTokenAddress: '0xf602d9617564c07f1e128687798d8c699ced3961',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
    description: 'Moola variable debt',
    title: 'cUSD debt',
  },
  {
    baseTokenAddress: '0xe8537a3d056da446677b9e9d6c5db704eaab4787',
    debtTokenAddress: '0xbd408042909351B649DC50353532dEeF6De9fAA9',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
    description: 'Moola variable debt',
    title: 'cREAL debt',
  },
  {
    baseTokenAddress: '0x471ece3750da237f93b8e339c536989b8978a438',
    debtTokenAddress: '0xaf451d23d6f0fa680113ce2d27a891aa3587f0c3',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
    description: 'Moola variable debt',
    title: 'CELO debt',
  },
  {
    baseTokenAddress: '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73',
    debtTokenAddress: '0x612599d8421f36b7da4ddba201a3854ff55e3d03',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
    description: 'Moola stable debt',
    title: 'cEUR debt',
  },
  {
    baseTokenAddress: '0x765de816845861e75a25fca122bb6898b8b1282a',
    debtTokenAddress: '0xa9f50d9f7c03e8b48b2415218008822ea3334adb',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
    description: 'Moola stable debt',
    title: 'cUSD debt',
  },
  {
    baseTokenAddress: '0xe8537a3d056da446677b9e9d6c5db704eaab4787',
    debtTokenAddress: '0x0d00d9a02b85e9274f60a082609f44f7c57f373d',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
    description: 'Moola stable debt',
    title: 'cREAL debt',
  },
  {
    baseTokenAddress: '0x471ece3750da237f93b8e339c536989b8978a438',
    debtTokenAddress: '0x02661dd90c6243fe5cdf88de3e8cb74bcc3bd25e',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
    description: 'Moola stable debt',
    title: 'CELO debt',
  },
]
