import BigNumber from 'bignumber.js'
import { DecimalNumber } from '../../numbers'
import {
  AppPlugin,
  ContractPositionDefinition,
  TokenDefinition,
} from '../../plugin'
import got from 'got'

// User-Agent header is required by the HaloFi API
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)'

type PlayerGameResponse = {
  playerId: string
  gameId: string
  mostRecentSegmentPaid: number
  paidAmount: string
  netPaidAmount: string
  withdrawn: boolean
  withdrawalSegment: number
  canRejoin: boolean
  isWinner: boolean
  isWaiting: boolean
  gameStartsAt: string
  waitingRoundStartsAt: string
  segmentLength: string
  waitingRoundLength: string
  totalSegmentCount: string
  paymentCount: string
  currentSegment: string
  isGameCompleted: boolean
  gameAPY: string
  totalEarningsConverted: string
  playerTotalEarningsConverted: string
  rewards?: RewardBalance[]
  interestAmount: string
}

type RewardBalance = {
  tokenId: string
  address: string
  type: string
  balance: string
  convertedBalance: string
}

type GamesResponse = Record<
  string,
  {
    strategyController: string
    displayId: number
    networkId: string
    depositToken: string
    liquidityToken: string
    gameName: string
    subgraphId: string
    roundMeasure: string
    contractVersion: string
    isCapped: boolean
    maxPlayers: string
    strategyProvider: string
    paymentAmount: string
    isWhitelisted: boolean
    isHidden: boolean
    ggScore: number
    gameNameShort: string
    description: string
    payments: string
    riskProfile: string
    proposer: string
    calenderUrl: string
    blogPostUri: string
    id: string
    gameStartsAt: string
    segmentLength: string
    paymentCount: string
    totalSegmentCount: string
    waitingRoundStartsAt: string
    waitingRoundLength: string
    earlyWithdrawalFee: string
    performanceFee: string
    maxDepositAmount: string
    tags?: string[]
    liquidityTokenAddress: string
    depositTokenAddress: string
    depositType: string
    mechanismType: string
    gameEndsAt: string
    gameClosesAt: string
    rewards?: Reward[]
    currentSegment: string
    isCompleted: boolean
  }
>

type Reward = {
  tokenId: string
  address: string
  type: string
}

const plugin: AppPlugin = {
  getInfo() {
    return {
      id: 'halofi',
      name: 'HaloFi',
      description: '',
    }
  },
  async getPositionDefinitions(network, address) {
    const [games, playerGames] = await Promise.all([
      got
        .get('https://goodghosting-api.com/v1/games', {
          headers: { 'User-Agent': USER_AGENT },
        })
        .json<GamesResponse>(),
      got
        .get('https://goodghosting-api.com/v1/players/active-games', {
          searchParams: {
            networkId: 42220, // Celo mainnet
            playerAddress: address,
          },
          headers: { 'User-Agent': USER_AGENT },
        })
        .json<PlayerGameResponse[]>(),
    ])

    // console.log({ games, playerGames })

    return playerGames.map((playerGame) => {
      const game = games[playerGame.gameId]
      const rewards = playerGame.rewards ?? []
      const position: ContractPositionDefinition = {
        type: 'contract-position-definition',
        network,
        address: game.id.toLowerCase(),
        tokens: [
          { address: game.depositTokenAddress.toLowerCase(), network },
          ...rewards.map((reward) => ({
            address: reward.address.toLowerCase(),
            network,
          })),
        ],
        displayProps: {
          title: game.gameNameShort,
          description: 'Challenge',
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/halofi.png',
        },
        balances: async () => {
          return [
            playerGame.paidAmount,
            // Some of these are claimable rewards
            ...rewards.map((reward) => reward.balance),
          ].map((value) => new BigNumber(value) as DecimalNumber)
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

export default plugin
