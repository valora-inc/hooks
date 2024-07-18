import { Chain, createPublicClient, http, PublicClient } from 'viem'
import {
  arbitrum,
  arbitrumSepolia,
  celo,
  celoAlfajores,
  mainnet,
  optimism,
  optimismSepolia,
  sepolia,
  polygon,
  polygonAmoy,
  base,
  baseSepolia,
} from 'viem/chains'
import { NetworkId } from '../types/networkId'
import { getConfig } from '../config'

const networkIdToViemChain: Record<NetworkId, Chain> = {
  [NetworkId['celo-mainnet']]: celo,
  [NetworkId['ethereum-mainnet']]: mainnet,
  [NetworkId['arbitrum-one']]: arbitrum,
  [NetworkId['op-mainnet']]: optimism,
  [NetworkId['celo-alfajores']]: celoAlfajores,
  [NetworkId['ethereum-sepolia']]: sepolia,
  [NetworkId['arbitrum-sepolia']]: arbitrumSepolia,
  [NetworkId['op-sepolia']]: optimismSepolia,
  [NetworkId['polygon-pos-mainnet']]: polygon,
  [NetworkId['polygon-pos-amoy']]: polygonAmoy,
  [NetworkId['base-mainnet']]: base,
  [NetworkId['base-sepolia']]: baseSepolia,
}

export function getClient(
  networkId: NetworkId,
): PublicClient<ReturnType<typeof http>, Chain> {
  const rpcUrl = getConfig().NETWORK_ID_TO_RPC_URL[networkId]
  return createPublicClient({
    chain: networkIdToViemChain[networkId],
    transport: http(rpcUrl),
  })
}
