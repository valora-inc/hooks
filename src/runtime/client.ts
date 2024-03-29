import { Chain, createPublicClient, http } from 'viem'
import {
  arbitrum,
  arbitrumSepolia,
  celo,
  celoAlfajores,
  mainnet,
  optimism,
  optimismSepolia,
  sepolia,
} from 'viem/chains'
import { NetworkId } from '../types/networkId'

const networkIdToViemChain: Record<NetworkId, Chain> = {
  [NetworkId['celo-mainnet']]: celo,
  [NetworkId['ethereum-mainnet']]: mainnet,
  [NetworkId['arbitrum-one']]: arbitrum,
  [NetworkId['op-mainnet']]: optimism,
  [NetworkId['celo-alfajores']]: celoAlfajores,
  [NetworkId['ethereum-sepolia']]: sepolia,
  [NetworkId['arbitrum-sepolia']]: arbitrumSepolia,
  [NetworkId['op-sepolia']]: optimismSepolia,
}

export function getClient(networkId: NetworkId) {
  return createPublicClient({
    chain: networkIdToViemChain[networkId],
    transport: http(),
  })
}
