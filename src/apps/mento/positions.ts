import {
  PositionsHook,
  ContractPositionDefinition,
} from '../../types/positions'
import { Address } from 'viem'
import { toDecimalNumber } from '../../types/numbers'
import { NetworkId } from '../../types/networkId'
import { getClient } from '../../runtime/client'
import { airdropAbi } from './abis/airdrop'
import got from 'got'
import { getTokenId } from '../../runtime/getTokenId'
import { lockingAbi } from './abis/locking'

const AIRDROP_CSV_URL =
  'https://raw.githubusercontent.com/mento-protocol/airgrab-interface/main/src/lib/merkle/list.csv'
const AIRDROP_ADDRESS = '0x7d8e73deafdbafc98fdbe7974168cfa6d8b9ae0c'

const VE_MENTO_ADDRESS = '0x001bb66636dcd149a1a2ba8c50e408bddd80279c'

async function getAirdropPositionDefinition(
  networkId: NetworkId,
  address: Address,
): Promise<ContractPositionDefinition | undefined> {
  if (networkId !== NetworkId['celo-mainnet']) {
    // Only on Celo mainnet
    return undefined
  }

  const client = getClient(networkId)
  const [tokenAddress, claimed] = await client.multicall({
    contracts: [
      {
        address: AIRDROP_ADDRESS,
        abi: airdropAbi,
        functionName: 'token',
        args: [],
      },
      {
        address: AIRDROP_ADDRESS,
        abi: airdropAbi,
        functionName: 'claimed',
        args: [address],
      },
    ],
    allowFailure: false,
  })

  if (claimed) {
    return undefined
  }

  // Download csv file and check if address is in the list
  const csv = await got.get(AIRDROP_CSV_URL).text()
  // Parse CSV
  const eligibleAddressesAndAmounts = csv.split('\n').map((line) => {
    const [address, amount] = line.split(',')
    return { address: address.toLowerCase(), amount: BigInt(amount) }
  })

  const eligibleEntry = eligibleAddressesAndAmounts.find(
    (entry) => entry.address === address,
  )
  if (!eligibleEntry) {
    return undefined
  }

  const position: ContractPositionDefinition = {
    type: 'contract-position-definition',
    networkId,
    address: AIRDROP_ADDRESS,
    tokens: [{ address: tokenAddress, networkId }],
    displayProps: {
      title: 'MENTO Airdrop',
      description: 'Claim on https://airdrop.mento.org before August 9th, 2024',
      imageUrl:
        'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/MENTO.png',
    },
    balances: async ({ resolvedTokensByTokenId }) => {
      const token =
        resolvedTokensByTokenId[
          getTokenId({
            address: tokenAddress,
            networkId,
          })
        ]

      return [toDecimalNumber(eligibleEntry.amount, token.decimals)]
    },
  }

  return position
}

async function getVeMentoPositionDefinition(
  networkId: NetworkId,
  address: Address,
): Promise<ContractPositionDefinition | undefined> {
  const client = getClient(networkId)
  const [tokenAddress, decimals, locked, balance] = await client.multicall({
    contracts: [
      {
        address: VE_MENTO_ADDRESS,
        abi: lockingAbi,
        functionName: 'token',
        args: [],
      },
      {
        address: VE_MENTO_ADDRESS,
        abi: lockingAbi,
        functionName: 'decimals',
        args: [],
      },
      {
        address: VE_MENTO_ADDRESS,
        abi: lockingAbi,
        functionName: 'locked',
        args: [address],
      },
      {
        address: VE_MENTO_ADDRESS,
        abi: lockingAbi,
        functionName: 'balanceOf',
        args: [address],
      },
    ],
    allowFailure: false,
  })

  if (locked === 0n) {
    return undefined
  }

  const position: ContractPositionDefinition = {
    type: 'contract-position-definition',
    networkId,
    address: VE_MENTO_ADDRESS,
    tokens: [{ address: tokenAddress, networkId }],
    displayProps: {
      title: 'veMENTO',
      description: `Voting power: ${toDecimalNumber(balance, decimals).toFormat(
        2,
      )}`,
      imageUrl:
        'https://raw.githubusercontent.com/valora-inc/hooks/main/src/apps/mento/assets/veMENTO.png',
    },
    balances: async ({ resolvedTokensByTokenId }) => {
      const token =
        resolvedTokensByTokenId[
          getTokenId({
            address: tokenAddress,
            networkId,
          })
        ]

      return [toDecimalNumber(locked, token.decimals)]
    },
  }

  return position
}

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'mento',
      name: 'Mento',
      description: '',
    }
  },
  async getPositionDefinitions(networkId, address) {
    const positions = await Promise.all([
      getAirdropPositionDefinition(networkId, address as Address),
      getVeMentoPositionDefinition(networkId, address as Address),
    ])
    return positions.filter(
      (p): p is Exclude<typeof p, null | undefined> => p != null,
    )
  },
}

export default hook
