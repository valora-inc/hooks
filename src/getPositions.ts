// Allow console logs for now, since we're early in development
/* eslint-disable no-console */
import got from 'got'
import { ubeswapPlugin } from './apps/ubeswap/plugin'
import {
  Address,
  ContractFunctionExecutionError,
  createPublicClient,
  http,
} from 'viem'
import { celo } from '@wagmi/chains'
import { erc20Abi } from './abis/erc-20'
import {
  AbstractToken,
  AppTokenPosition,
  AppTokenPositionDefinition,
  ContractPosition,
  ContractPositionDefinition,
  Position,
  PositionDefinition,
  PricePerShareContext,
  Token,
} from './plugin'
import { halofiPlugin } from './apps/halofi/plugin'
import { lockedCeloPlugin } from './apps/locked-celo/plugin'

interface RawTokenInfo {
  address: string
  name?: string
  symbol: string
  decimals: number
  usdPrice?: string
  imageUrl: string
}

interface TokenInfo extends Omit<AbstractToken, 'balance'> {
  imageUrl: string
}

type TokensInfo = Record<string, TokenInfo | undefined>

type DefinitionsByAddress = Record<string, AppPositionDefinition | undefined>

type AppPositionDefinition = PositionDefinition & {
  appId: string
}

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

async function getBaseTokensInfo(): Promise<TokensInfo> {
  // Get base tokens
  const data = await got
    .get(
      'https://us-central1-celo-mobile-mainnet.cloudfunctions.net/getTokensInfo',
    )
    .json<{ tokens: Record<string, RawTokenInfo> }>()

  // Map to TokenInfo
  const tokensInfo: TokensInfo = {}
  for (const [address, tokenInfo] of Object.entries(data.tokens)) {
    const addressLowerCase = address.toLowerCase()
    tokensInfo[addressLowerCase] = {
      network: 'celo', // TODO: adjust for other networks
      address: addressLowerCase,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
      imageUrl: tokenInfo.imageUrl,
      priceUsd: tokenInfo.usdPrice ? Number(tokenInfo.usdPrice) : 0,
    }
  }
  return tokensInfo
}

async function getERC20TokenInfo(address: Address): Promise<TokenInfo> {
  const erc20Contract = {
    address: address,
    abi: erc20Abi,
  } as const
  const [symbol, decimals] = await client.multicall({
    contracts: [
      {
        ...erc20Contract,
        functionName: 'symbol',
      },
      {
        ...erc20Contract,
        functionName: 'decimals',
      },
    ],
    allowFailure: false,
  })

  return {
    network: 'celo',
    address: address,
    symbol: symbol,
    decimals: decimals,
    imageUrl: '',
    priceUsd: 0, // Should we use undefined?
  }
}

function tokenWithUnderlyingBalance<T extends Token>(
  token: Omit<T, 'balance'>,
  decimals: number,
  balance: string,
  pricePerShare: number,
): T {
  const underlyingBalance = (
    (Number(balance) / 10 ** decimals) *
    10 ** token.decimals *
    pricePerShare
  ).toFixed(0)

  const appToken =
    token.type === 'app-token'
      ? (token as unknown as AppTokenPosition)
      : undefined

  return {
    ...token,
    ...(appToken && {
      tokens: appToken.tokens.map((underlyingToken, i) => {
        return tokenWithUnderlyingBalance(
          underlyingToken,
          token.decimals,
          underlyingBalance,
          appToken.pricePerShare[i],
        )
      }),
    }),
    balance: underlyingBalance,
  } as T
}

function getLabel(
  positionDefinition: PositionDefinition,
  resolvedTokens: Record<string, Omit<Token, 'balance'>>,
): string {
  if (typeof positionDefinition.label === 'function') {
    return positionDefinition.label({ resolvedTokens })
  } else {
    return positionDefinition.label
  }
}

async function resolveAppTokenPosition(
  address: string,
  positionDefinition: AppTokenPositionDefinition & { appId: string },
  tokensByAddress: TokensInfo,
  resolvedTokens: Record<string, Omit<Token, 'balance'>>,
): Promise<AppTokenPosition> {
  let pricePerShare: number[]
  if (typeof positionDefinition.pricePerShare === 'function') {
    pricePerShare = await positionDefinition.pricePerShare({
      tokensByAddress,
    } as PricePerShareContext)
  } else {
    pricePerShare = positionDefinition.pricePerShare
  }

  let priceUsd = 0
  for (let i = 0; i < positionDefinition.tokens.length; i++) {
    const token = positionDefinition.tokens[i]
    const tokenInfo = tokensByAddress[token.address]!
    priceUsd += Number(tokenInfo.priceUsd) * pricePerShare[i]
  }

  const positionTokenInfo = tokensByAddress[positionDefinition.address]!

  const appTokenContract = {
    address: positionDefinition.address as Address,
    abi: erc20Abi,
  } as const
  const [balance, totalSupply] = await client.multicall({
    contracts: [
      {
        ...appTokenContract,
        functionName: 'balanceOf',
        args: [address as Address], // TODO: this is incorrect for intermediary app tokens
      },
      {
        ...appTokenContract,
        functionName: 'totalSupply',
      },
    ],
    allowFailure: false,
  })

  const position: AppTokenPosition = {
    type: 'app-token',
    network: positionDefinition.network,
    address: positionDefinition.address,
    appId: positionDefinition.appId,
    symbol: positionTokenInfo.symbol,
    decimals: positionTokenInfo.decimals,
    label: getLabel(positionDefinition, resolvedTokens),
    tokens: positionDefinition.tokens.map((token, i) =>
      tokenWithUnderlyingBalance(
        resolvedTokens[token.address],
        positionTokenInfo.decimals,
        balance.toString(),
        pricePerShare[i],
      ),
    ),
    pricePerShare,
    priceUsd,
    balance: balance.toString(),
    supply: totalSupply.toString(),
  }

  return position
}

async function resolveContractPosition(
  _address: string,
  positionDefinition: ContractPositionDefinition & { appId: string },
  _tokensByAddress: TokensInfo,
  resolvedTokens: Record<string, Omit<Token, 'balance'>>,
): Promise<ContractPosition> {
  let balances: string[]
  if (typeof positionDefinition.balances === 'function') {
    balances = await positionDefinition.balances({
      resolvedTokens,
    })
  } else {
    balances = positionDefinition.balances
  }

  const tokens = positionDefinition.tokens.map((token, i) =>
    tokenWithUnderlyingBalance(
      resolvedTokens[token.address],
      0, // This balance is already in the correct decimals
      balances[i],
      1,
    ),
  )

  let balanceUsd = 0
  for (let i = 0; i < positionDefinition.tokens.length; i++) {
    const token = positionDefinition.tokens[i]
    const tokenInfo = resolvedTokens[token.address]
    balanceUsd += Number(balances[i]) * tokenInfo.priceUsd
  }

  const position: ContractPosition = {
    type: 'contract-position',
    address: positionDefinition.address,
    network: positionDefinition.network,
    appId: positionDefinition.appId,
    label: getLabel(positionDefinition, resolvedTokens),
    tokens: tokens,
    balanceUsd: balanceUsd.toString(),
  }

  return position
}

function addAppId<T>(definition: T, appId: string) {
  return {
    ...definition,
    appId,
  }
}

// This is the main logic to get positions
export async function getPositions(network: string, address: string) {
  // First get all position definitions for the given address
  const definitions = await Promise.all(
    [ubeswapPlugin, halofiPlugin, lockedCeloPlugin].map((plugin) =>
      plugin.getPositionDefinitions(network, address).then((definitions) => {
        const appId = plugin.getInfo().id
        return definitions.map((definition) => addAppId(definition, appId))
      }),
    ),
  ).then((definitions) => definitions.flat())
  console.log('positions definitions', JSON.stringify(definitions, null, ' '))

  // Get the base tokens info
  const baseTokensInfo = await getBaseTokensInfo()

  let unlistedBaseTokensInfo: TokensInfo = {}
  let definitionsToResolve: AppPositionDefinition[] = definitions
  const visitedDefinitions: DefinitionsByAddress = {}
  while (true) {
    // Visit each definition we haven't visited yet
    definitionsToResolve = definitionsToResolve.filter((definition) => {
      if (visitedDefinitions[definition.address]) {
        return false
      }
      visitedDefinitions[definition.address] = definition
      return true
    })

    if (definitionsToResolve.length === 0) {
      console.log('No more positions to resolve')
      break
    }

    // Resolve token definitions to tokens
    const allTokenDefinitions = definitionsToResolve.flatMap(
      (position) => position.tokens,
    )

    console.log(
      'allTokenDefinitions',
      JSON.stringify(allTokenDefinitions, null, ' '),
    )

    // Get the tokens definitions for which we don't have the base token info or position definition
    const unresolvedTokenDefinitions = allTokenDefinitions.filter(
      (tokenDefinition) =>
        !{ ...baseTokensInfo, ...unlistedBaseTokensInfo }[
          tokenDefinition.address
        ] && !visitedDefinitions[tokenDefinition.address],
    )

    console.log(
      'unresolvedTokenDefinitions',
      JSON.stringify(unresolvedTokenDefinitions, null, ' '),
    )

    // Get the token info for the unresolved token definitions
    const newUnlistedBaseTokensInfo: TokensInfo = {}
    const appTokenDefinitions = (
      await Promise.all(
        unresolvedTokenDefinitions.map(async (tokenDefinition) => {
          try {
            // Assume the token is an app token from the plugin
            // TODO: use the right plugin
            const appTokenDefinition = await ubeswapPlugin
              .getAppTokenDefinition(tokenDefinition)
              .then((definition) =>
                addAppId(definition, ubeswapPlugin.getInfo().id),
              )
            return appTokenDefinition
          } catch (e) {
            if (e instanceof ContractFunctionExecutionError) {
              // Assume the token is an ERC20 token
              const erc20TokenInfo = await getERC20TokenInfo(
                tokenDefinition.address as Address,
              )
              newUnlistedBaseTokensInfo[tokenDefinition.address] =
                erc20TokenInfo
              return
            }
            throw e
          }
        }),
      )
    ).filter((p): p is Exclude<typeof p, null | undefined> => p != null)

    console.log(
      'appTokenDefinitions',
      JSON.stringify(appTokenDefinitions, null, ' '),
    )
    console.log(
      'newUnlistedBaseTokensInfo',
      JSON.stringify(newUnlistedBaseTokensInfo, null, ' '),
    )

    unlistedBaseTokensInfo = {
      ...unlistedBaseTokensInfo,
      ...newUnlistedBaseTokensInfo,
    }

    // Get the definitions to resolve for the next iteration
    definitionsToResolve = appTokenDefinitions
  }

  console.log({
    unlistedBaseTokensInfo,
    visitedPositions: visitedDefinitions,
  })

  const baseTokensByAddress: TokensInfo = {
    ...baseTokensInfo,
    ...unlistedBaseTokensInfo,
  }
  const appTokensInfo = await Promise.all(
    Object.values(visitedDefinitions)
      .filter(
        (position) =>
          position?.type === 'app-token-definition' &&
          !baseTokensByAddress[position.address],
      )
      .map((definition) => getERC20TokenInfo(definition!.address as Address)),
  )
  const appTokensByAddress: TokensInfo = {}
  for (const tokenInfo of appTokensInfo) {
    appTokensByAddress[tokenInfo.address] = tokenInfo
  }

  const tokensByAddress = {
    ...baseTokensByAddress,
    ...appTokensByAddress,
  }

  // We now have all the base tokens info and position definitions
  // including intermediary app tokens definitions
  // We can now resolve the positions

  // Start with the base tokens
  const resolvedTokens: Record<string, Omit<Token, 'balance'>> = {}
  for (const token of Object.values(baseTokensByAddress)) {
    if (!token) {
      continue
    }
    resolvedTokens[token.address] = {
      ...token,
      type: 'base-token',
    }
  }

  // TODO: we need to sort the positions by dependencies (tokens)
  // so that we can resolve them in the right order needed
  // Then we can also parallelize the resolution of positions, starting with those with no dependencies

  // For now sort with app tokens first
  const sortedDefinitions = Object.values(visitedDefinitions).sort(
    (a, b) =>
      (a?.type === 'app-token-definition' ? 0 : 1) -
      (b?.type === 'app-token-definition' ? 0 : 1),
  )

  const resolvedPositions: Record<string, Position> = {}
  for (const positionDefinition of sortedDefinitions) {
    if (!positionDefinition) {
      continue
    }

    const type = positionDefinition.type

    console.log('Resolving definition', type, positionDefinition.address)

    let position: Position
    switch (type) {
      case 'app-token-definition':
        position = await resolveAppTokenPosition(
          address,
          positionDefinition,
          tokensByAddress,
          resolvedTokens,
        )
        resolvedTokens[positionDefinition.address] = position
        break
      case 'contract-position-definition':
        position = await resolveContractPosition(
          address,
          positionDefinition,
          tokensByAddress,
          resolvedTokens,
        )
        break
      default:
        const assertNever: never = type
        return assertNever
    }

    resolvedPositions[positionDefinition.address] = position
  }

  return definitions.map((definition) => {
    const resolvedPosition = resolvedPositions[definition.address]
    // Sanity check
    if (!resolvedPosition) {
      throw new Error(
        `Could not resolve ${definition.type}: ${definition.address}`,
      )
    }
    return resolvedPosition
  })
}
