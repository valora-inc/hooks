import {
  PositionsHook,
  ContractPositionDefinition,
} from '../../types/positions'
import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { toDecimalNumber } from '../../types/numbers'
import { ubiSchemeAbi } from './abis/ubi-scheme'
import { identityAbi } from './abis/identity'

// From https://github.com/GoodDollar/GoodProtocol/blob/b713457581d7cd7148dea9d5107883779442650e/releases/deployment.json#L480C23-L480C65
const UBI_ADDRESS = '0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1'
// From https://github.com/GoodDollar/GoodProtocol/blob/b713457581d7cd7148dea9d5107883779442650e/releases/deployment.json#L468
const IDENTITY_ADDRESS = '0xC361A6E67822a0EDc17D899227dd9FC50BD62F42'

const G$_ADDRESS = '0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a'
const G$_DECIMALS = 18

const ONE_SECOND_IN_MS = 1000
const ONE_HOUR_IN_MS = 60 * 60 * ONE_SECOND_IN_MS
const ONE_DAY_IN_MS = ONE_HOUR_IN_MS * 24

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'gooddollar',
      name: 'GoodDollar',
      description: '',
    }
  },
  async getPositionDefinitions(network, address) {
    const ubiContract = {
      address: UBI_ADDRESS,
      abi: ubiSchemeAbi,
    } as const

    const identityContract = {
      address: IDENTITY_ADDRESS,
      abi: identityAbi,
    } as const

    const [isWhitelisted, currentDay, periodStart, claimAmount] =
      await client.multicall({
        contracts: [
          {
            ...identityContract,
            functionName: 'isWhitelisted',
            args: [address as Address],
          },
          {
            ...ubiContract,
            functionName: 'currentDay',
          },
          {
            ...ubiContract,
            functionName: 'periodStart',
          },
          {
            ...ubiContract,
            functionName: 'checkEntitlement',
            args: [address as Address],
          },
        ],
        allowFailure: false,
      })

    let startDate = new Date(
      Number(periodStart) * 1000 + Number(currentDay) * ONE_DAY_IN_MS,
    )
    if (startDate < new Date()) {
      startDate = new Date(
        Number(periodStart) * 1000 + Number(currentDay + 1n) * ONE_DAY_IN_MS,
      )
    }

    const position: ContractPositionDefinition = {
      type: 'contract-position-definition',
      network,
      address: UBI_ADDRESS,
      tokens: [{ address: G$_ADDRESS, network }],
      displayProps: {
        title: 'Daily UBI',
        description: !isWhitelisted
          ? 'Verify on the dapp to claim'
          : claimAmount > 0n
          ? 'Claim now'
          : // Claim in X hours
            `Claim ${new Intl.RelativeTimeFormat('en', {
              style: 'long',
            }).format(
              Math.ceil((startDate.getTime() - Date.now()) / ONE_HOUR_IN_MS),
              'hour',
            )}`,
        imageUrl:
          'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/gooddollar.png',
      },
      balances: [toDecimalNumber(claimAmount, G$_DECIMALS)],
    }

    return [position]
  },
  getAppTokenDefinition() {
    // We don't need this for now, since there are no intermediary tokens
    throw new Error('Not implemented')
  },
}

export default hook
