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

const AIRDROP_CSV_URL =
  'https://raw.githubusercontent.com/mento-protocol/airgrab-interface/main/src/lib/merkle/list.csv'
const AIRDROP_ADDRESS = '0x7d8e73deafdbafc98fdbe7974168cfa6d8b9ae0c'

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

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'mento',
      name: 'Mento',
      description: '',
    }
  },
  async getPositionDefinitions(networkId, address) {
    const airdropPosition = await getAirdropPositionDefinition(
      networkId,
      address as Address,
    )
    return airdropPosition ? [airdropPosition] : []
  },
}

export default hook
