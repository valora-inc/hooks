import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { poolV205Abi } from './abis/pool-v205'
import { erc20Abi } from '../../abis/erc-20'

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

export async function getPlayerStructFromGames(
  games: Address[],
  playerAddress: Address,
) {
  const contractsCalls = games.map((address) => ({
    address: address,
    abi: poolV205Abi,
    functionName: 'players' as const,
    args: [playerAddress] as readonly [Address],
  }))

  const haloFiPlayerStructs = await client.multicall({
    contracts: contractsCalls,
    allowFailure: false,
  })

  return haloFiPlayerStructs
}

export const PlayerStructIndex = {
  netAmountPaid: 7,
  playerAddress: 3,
} as const

export async function getTokensDecimals(
  tokenAddresses: Address[],
): Promise<number[]> {
  const decimals = await client.multicall({
    contracts: tokenAddresses.map((address) => ({
      abi: erc20Abi,
      address,
      functionName: 'decimals' as const,
    })),

    allowFailure: false,
  })

  return decimals
}
