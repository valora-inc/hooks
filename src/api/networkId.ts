export enum LegacyNetwork {
  celo = 'celo',
  celoAlfajores = 'celoAlfajores',
}

export enum NetworkId {
  'celo-mainnet' = 'celo-mainnet',
  'celo-alfajores' = 'celo-alfajores',
  'ethereum-mainnet' = 'ethereum-mainnet',
  'ethereum-sepolia' = 'ethereum-sepolia',
  'arbitrum-one' = 'arbitrum-one',
  'arbitrum-sepolia' = 'arbitrum-sepolia',
  'op-mainnet' = 'op-mainnet',
  'op-sepolia' = 'op-sepolia',
}

export const legacyNetworkToNetworkId: Record<LegacyNetwork, NetworkId> = {
  [LegacyNetwork.celo]: NetworkId['celo-mainnet'],
  [LegacyNetwork.celoAlfajores]: NetworkId['celo-alfajores'],
}
