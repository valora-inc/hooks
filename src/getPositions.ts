// Allow console logs for now, since we're early in development
/* eslint-disable no-console */
import { promises as fs } from 'fs'
import path from 'path'
import got from 'got'
import BigNumber from 'bignumber.js'
import ubeswapPlugin from './apps/ubeswap/plugin'
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
  AppPlugin,
  AppTokenPosition,
  AppTokenPositionDefinition,
  ContractPosition,
  ContractPositionDefinition,
  Position,
  PositionDefinition,
  PricePerShareContext,
  Token,
} from './plugin'
import {
  DecimalNumber,
  toBigDecimal,
  toDecimalNumber,
  toInteger,
} from './numbers'

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

const APP_ID_PATTERN = /^[a-zA-Z0-9-]+$/

async function getAllAppIds(): Promise<string[]> {
  // Read all folders from the "apps" folder
  const files = await fs.readdir(path.join(__dirname, 'apps'), {
    withFileTypes: true,
  })
  const folders = files.filter((file) => file.isDirectory())
  // Check that all folders are valid app ids
  for (const folder of folders) {
    if (!APP_ID_PATTERN.test(folder.name)) {
      throw new Error(
        `Invalid app id: '${folder.name}', must match ${APP_ID_PATTERN}`,
      )
    }
  }
  return folders.map((folder) => folder.name)
}

async function getPlugins(appIds: string[]): Promise<AppPlugin[]> {
  const allAppIds = await getAllAppIds()
  const plugins: AppPlugin[] = []
  const appIdsToLoad = appIds.length === 0 ? allAppIds : appIds
  for (const appId of appIdsToLoad) {
    if (!allAppIds.includes(appId)) {
      throw new Error(
        `No app with id '${appId}' found, available apps: ${allAppIds.join(
          ', ',
        )}`,
      )
    }
    const plugin = await import(`./apps/${appId}/plugin`)
    plugins.push(plugin.default)
  }
  return plugins
}

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
      priceUsd: toDecimalNumber(tokenInfo.usdPrice ?? 0),
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
    priceUsd: toDecimalNumber(0), // Should we use undefined?
  }
}

function tokenWithUnderlyingBalance<T extends Token>(
  token: Omit<T, 'balance'>,
  balance: DecimalNumber,
  pricePerShare: DecimalNumber,
): T {
  const underlyingBalance = new BigNumber(balance).times(pricePerShare)

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
          toDecimalNumber(underlyingBalance),
          appToken.pricePerShare[i],
        )
      }),
    }),
    balance: toInteger(
      BigInt(
        underlyingBalance
          .times(new BigNumber(10).pow(token.decimals))
          .toFixed(0),
      ),
    ),
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
  let pricePerShare: DecimalNumber[]
  if (typeof positionDefinition.pricePerShare === 'function') {
    pricePerShare = await positionDefinition.pricePerShare({
      tokensByAddress,
    } as PricePerShareContext)
  } else {
    pricePerShare = positionDefinition.pricePerShare
  }

  let priceUsd = new BigNumber(0)
  for (let i = 0; i < positionDefinition.tokens.length; i++) {
    const token = positionDefinition.tokens[i]
    const tokenInfo = tokensByAddress[token.address]!
    priceUsd = priceUsd.plus(tokenInfo.priceUsd).times(pricePerShare[i])
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
        toDecimalNumber(toBigDecimal(balance, positionTokenInfo.decimals)),
        pricePerShare[i],
      ),
    ),
    pricePerShare,
    priceUsd: toDecimalNumber(priceUsd),
    balance: toInteger(balance),
    supply: toInteger(totalSupply),
  }

  return position
}

async function resolveContractPosition(
  _address: string,
  positionDefinition: ContractPositionDefinition & { appId: string },
  _tokensByAddress: TokensInfo,
  resolvedTokens: Record<string, Omit<Token, 'balance'>>,
): Promise<ContractPosition> {
  let balances: DecimalNumber[]
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
      balances[i],
      toDecimalNumber(1),
    ),
  )

  let balanceUsd = new BigNumber(0)
  for (let i = 0; i < positionDefinition.tokens.length; i++) {
    const token = positionDefinition.tokens[i]
    const tokenInfo = resolvedTokens[token.address]
    balanceUsd = balanceUsd.plus(balances[i]).times(tokenInfo.priceUsd)
  }

  const position: ContractPosition = {
    type: 'contract-position',
    address: positionDefinition.address,
    network: positionDefinition.network,
    appId: positionDefinition.appId,
    label: getLabel(positionDefinition, resolvedTokens),
    tokens: tokens,
    balanceUsd: toDecimalNumber(balanceUsd),
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
export async function getPositions(
  network: string,
  address: string,
  appIds: string[] = [],
) {
  const plugins = await getPlugins(appIds)

  // First get all position definitions for the given address
  const definitions = await Promise.all(
    plugins.map((plugin) =>
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
