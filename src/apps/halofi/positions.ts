import {
  ContractPositionDefinition,
  PositionsHook,
  TokenDefinition,
} from '../../types/positions'
import { Address, zeroAddress } from 'viem'

import { toDecimalNumber } from '../../types/numbers'
import { getCompatibleGamesFromAPI } from './haloFiApi'
import {
  PlayerStructIndex,
  getPlayerStructFromGames,
  getTokensDecimals,
} from './haloFiContract'

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
        ),
    )

    const uniqueTokensFromJoinedGames = haloFiGamesPlayerHasJoined
      .map(({ game }) => game.depositTokenAddress.toLowerCase() as Address)
      .filter((address, index, self) => self.indexOf(address) === index)

    const decimals = await getTokensDecimals(uniqueTokensFromJoinedGames)

    return haloFiGamesPlayerHasJoined.map(({ playerStruct, game }) => {
      const depositTokenAddress = game.depositTokenAddress.toLowerCase()

      const tokenIndex = uniqueTokensFromJoinedGames.findIndex(
        (value) => value === depositTokenAddress,
      )
      const depositTokenDecimals = decimals[tokenIndex]

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
        balances: async () => {
          const playerAmountPaid = toDecimalNumber(
            playerStruct[PlayerStructIndex.netAmountPaid],
            depositTokenDecimals,
          )
          return [playerAmountPaid]
        },
      }
      return position
    })
  },
  getAppTokenDefinition(_context: TokenDefinition) {
    // We don't need this for now, since there are no intermediary tokens
    throw new Error('Not implemented')
  },
}

export default hook
