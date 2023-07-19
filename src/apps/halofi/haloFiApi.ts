import got from 'got'
import { celo } from 'viem/chains'

type Game = {
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

type Reward = {
  tokenId: string
  address: string
  type: string
}

export type APIGamesResponse = Record<string, Game>

// User-Agent header is required by the HaloFi API
const API_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)'

export async function getCompatibleGamesFromAPI(): Promise<Game[]> {
  const [games] = await Promise.all([
    got
      .get('https://goodghosting-api.com/v1/games', {
        headers: { 'User-Agent': API_USER_AGENT },
      })
      .json<APIGamesResponse>(),
  ])

  const compatibleGames = Object.values(games).filter((game) => {
    const isV2Game = game.contractVersion.startsWith('2.0')
    const isCeloGame = Number(game.networkId) === celo.id
    const hasDepositToken = Boolean(game.depositTokenAddress)

    return isV2Game && isCeloGame && hasDepositToken
  })

  return compatibleGames
}
