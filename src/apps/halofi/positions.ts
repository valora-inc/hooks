import {
  ContractPositionDefinition,
  PositionsHook,
  TokenDefinition,
} from '../../types/positions'
import { Address, zeroAddress } from 'viem'

import { toDecimalNumber } from '../../types/numbers'
import { getCompatibleGamesFromAPI } from './haloFiApi'
import { PlayerStructIndex, getPlayerStructFromGames } from './haloFiContract'

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'halofi',
      name: 'HaloFi',
      description:
        'Grow wealth with crypto, earn rewards, badges & more. We make personal finance fun.',
    }
  },
  async getPositionDefinitions(network, address) {
    const compatibleGames = await getCompatibleGamesFromAPI()

    const contractAddressList = compatibleGames.map(
      (game) => game.id as Address,
    )
    const haloFiGamesPlayerHasJoined = await getPlayerStructFromGames(
      contractAddressList,
      address as Address,
    ).then((structs) =>
      structs
        .map((playerStruct, index) => ({
          playerStruct,
          game: compatibleGames[index],
        }))
        .filter(
          ({ playerStruct }) =>
            playerStruct[PlayerStructIndex.playerAddress] !== zeroAddress,
        )
        .filter(
          ({ playerStruct }) =>
            playerStruct[PlayerStructIndex.withdrawn] === false,
        ),
    )

    return haloFiGamesPlayerHasJoined.map(({ playerStruct, game }) => {
      const depositTokenAddress = game.depositTokenAddress.toLowerCase()

      const position: ContractPositionDefinition = {
        type: 'contract-position-definition',
        network,
        address: game.id.toLowerCase(),
        tokens: [{ address: depositTokenAddress, network }],
        displayProps: {
          title: game.gameNameShort,
          description: 'Challenge',
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/halofi.png',
        },
        balances: async ({ resolvedTokens }) => {
          const depositToken = resolvedTokens[depositTokenAddress]

          const playerAmountPaid = toDecimalNumber(
            playerStruct[PlayerStructIndex.netAmountPaid],
            depositToken.decimals,
          )
          return [playerAmountPaid]
        },
      }
      return position
    })
  },
}

export default hook
