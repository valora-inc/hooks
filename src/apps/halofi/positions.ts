import {
  ContractPositionDefinition,
  PositionsHook,
} from '../../types/positions'
import { Address, zeroAddress } from 'viem'

import { toDecimalNumber } from '../../types/numbers'
import { getCompatibleGamesFromAPI } from './haloFiApi'
import { PlayerStructIndex, getPlayerStructFromGames } from './haloFiContract'
import { NetworkId } from '../../types/networkId'
import { getTokenId } from '../../runtime/getTokenId'

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'halofi',
      name: 'HaloFi',
      description:
        'Grow wealth with crypto, earn rewards, badges & more. We make personal finance fun.',
    }
  },
  async getPositionDefinitions(networkId, address) {
    if (networkId !== NetworkId['celo-mainnet'] || !address) {
      // dapp is only on Celo, and implementation is hardcoded to Celo mainnet (contract addresses in particular)
      return []
    }
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
        networkId,
        address: game.id.toLowerCase(),
        tokens: [{ address: depositTokenAddress, networkId }],
        displayProps: {
          title: game.gameNameShort,
          description: 'Challenge',
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/halofi.png',
        },
        balances: async ({ resolvedTokensByTokenId }) => {
          const depositToken =
            resolvedTokensByTokenId[
              getTokenId({
                address: depositTokenAddress,
                networkId,
              })
            ]

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
