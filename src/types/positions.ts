import { DecimalNumber, SerializedDecimalNumber } from './numbers'
import { NetworkId } from './networkId'
import { TFunction } from 'i18next'

// Interface that authors will implement
export interface PositionsHook {
  getInfo(): AppInfo

  // Get position definitions
  // Note: it can be called with or without an address
  // If called without an address, it should return all positions available for the network
  getPositionDefinitions({
    networkId,
    address,
    t,
  }: {
    networkId: NetworkId
    address?: string
    t: TFunction<'translation', undefined>
  }): Promise<PositionDefinition[]>

  // Get an app token definition from a token definition
  // This is needed when a position definition has one ore more intermediary app tokens, which are not base tokens.
  // For instance a farm position composed of a LP token.
  // The runtime needs to call this function to resolve such intermediary tokens.
  getAppTokenDefinition?(
    tokenDefinition: TokenDefinition,
  ): Promise<AppTokenPositionDefinition>
}

export interface TokenDefinition {
  address: string
  networkId: NetworkId
  // Escape hatch for priceUsd in case the token is not in our list of base tokens
  // and it's difficult to decompose the token into base token
  // Ideally we should add apps to resolve such tokens
  // For example: Beefy vault depends on Aave, Curve, etc.
  // but we don't yet have all these apps implemented
  // Note: there's also a limitation in the runtime as it can't yet always resolve tokens between apps
  // This will be fixed "soon"
  fallbackPriceUsd?: SerializedDecimalNumber
}

// To be returned when `getAppTokenDefinition` can't resolve a token
export class UnknownAppTokenError extends Error {
  constructor({ networkId, address }: TokenDefinition) {
    super(`Unknown app token: ${networkId}:${address}`)
  }
}

export type TokenCategory = 'claimable' // We could add more categories later

export interface DisplayPropsContext {
  resolvedTokensByTokenId: Record<string, Omit<Token, 'balance'>>
}

export interface DisplayProps {
  title: string // Example: CELO / cUSD
  description: string // Example: Pool
  imageUrl: string // Example: https://...
}

export interface DataPropsContext {
  resolvedTokensByTokenId: Record<string, Omit<Token, 'balance'>>
}

// For now list all the data props we need
// But in the future we could parameterize this
export type DataProps = EarnDataProps

export interface YieldRate {
  percentage: number
  label: string
  tokenId: string
}

export interface EarningItem {
  amount: DecimalNumber
  label: string
  tokenId: string
  subtractFromDeposit?: boolean
}

export interface EarnDataProps {
  contractCreatedAt?: string // ISO string
  manageUrl?: string
  termsUrl?: string
  tvl?: SerializedDecimalNumber
  yieldRates: YieldRate[]
  earningItems: EarningItem[]
  depositTokenId: string
  withdrawTokenId: string
  // We'll add more fields here as needed
}

export interface AbstractPositionDefinition {
  networkId: NetworkId
  address: string
  displayProps: ((context: DisplayPropsContext) => DisplayProps) | DisplayProps
  dataProps?: ((context: DataPropsContext) => DataProps) | DataProps
  tokens: (TokenDefinition & {
    category?: TokenCategory
  })[]

  availableShortcutIds?: string[] // Allows to apply shortcuts to positions
}

export interface PricePerShareContext {
  tokensByTokenId: Record<string, Omit<AbstractToken, 'balance'>>
}

export interface AppTokenPositionDefinition extends AbstractPositionDefinition {
  type: 'app-token-definition'
  pricePerShare:
    | ((context: PricePerShareContext) => Promise<DecimalNumber[]>)
    | DecimalNumber[]
}

export interface BalancesContext {
  resolvedTokensByTokenId: Record<string, Omit<Token, 'balance'>>
}

export interface ContractPositionDefinition extends AbstractPositionDefinition {
  type: 'contract-position-definition'
  // Needed in some cases to differentiate between different positions of the same contract
  // for instance Uniswap V3 positions on a given liquidity pool but at different ranges
  extraId?: string
  balances:
    | ((context: BalancesContext) => Promise<DecimalNumber[]>)
    | DecimalNumber[]
}

export type PositionDefinition =
  | AppTokenPositionDefinition
  | ContractPositionDefinition

// Generic info about the app
// Note: this could be used for dapp listing too
export interface AppInfo {
  id: string // Example: ubeswap
  name: string // Example: Ubeswap
  description: string // Example: Decentralized exchange on Celo
}

export interface AbstractPosition {
  // Should be unique across all positions
  // And treated as an opaque identifier by consumers
  positionId: string // Example: celo-mainnet:0x...
  address: string // Example: 0x...
  networkId: NetworkId // Example: celo-mainnet
  appId: string // Example: ubeswap
  appName: string // Example: Ubeswap
  /**
   * @deprecated replaced by displayProps
   */
  label: string // Example: Pool
  displayProps: DisplayProps
  dataProps?: DataProps
  tokens: (Token & { category?: TokenCategory })[]
  availableShortcutIds: string[] // Allows to apply shortcuts to positions
}

export interface AbstractToken {
  tokenId: string // Example: celo-mainnet:0x123...
  address?: string // Example: 0x...
  networkId: NetworkId // Example: celo-mainnet

  // These would be resolved dynamically
  symbol: string // Example: cUSD
  decimals: number // Example: 18
  priceUsd: SerializedDecimalNumber // Example: "1.5"
  balance: SerializedDecimalNumber // Example: "200", would be negative for debt
}

export interface BaseToken extends AbstractToken {
  type: 'base-token'
}

export type AppTokenPosition = AbstractPosition &
  AbstractToken & {
    type: 'app-token'
    supply: SerializedDecimalNumber // Example: "1000"
    // Price ratio between the token and underlying token(s)
    pricePerShare: SerializedDecimalNumber[]
  }

export interface ContractPosition extends AbstractPosition {
  type: 'contract-position'
  // This would be derived from the underlying tokens
  balanceUsd: SerializedDecimalNumber
}

export type Token = BaseToken | AppTokenPosition
export type Position = AppTokenPosition | ContractPosition
