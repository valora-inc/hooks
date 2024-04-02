import got from 'got'
import BigNumber from 'bignumber.js'
import { Address, ContractFunctionExecutionError } from 'viem'
import { erc20Abi } from '../abis/erc-20'
import {
  AbstractToken,
  AppInfo,
  AppTokenPosition,
  AppTokenPositionDefinition,
  ContractPosition,
  ContractPositionDefinition,
  DisplayProps,
  Position,
  PositionDefinition,
  Token,
} from '../types/positions'
import {
  DecimalNumber,
  toDecimalNumber,
  toSerializedDecimalNumber,
} from '../types/numbers'
import { getHooks } from './getHooks'
import { logger } from '../log'
import { NetworkId } from '../types/networkId'
import { getClient } from './client'
import { getTokenId } from './getTokenId'
import { isNative } from './isNative'

interface RawTokenInfo {
  address?: string
  name: string
  symbol: string
  decimals: number
  imageUrl: string
  tokenId: string
  networkId: NetworkId
  isNative?: boolean
  priceUsd?: string
}

interface TokenInfo extends Omit<AbstractToken, 'balance'> {
  imageUrl: string
}

type TokensInfo = Record<string, TokenInfo>

type DefinitionsByTokenId = Record<string, AppPositionDefinition | undefined>

type AppPositionDefinition = PositionDefinition & {
  appId: string
}

async function getBaseTokensInfo(
  getTokensInfoUrl: string,
  networkId: NetworkId,
): Promise<TokensInfo> {
  // Get base tokens
  const data = await got
    .get(getTokensInfoUrl)
    .json<Record<string, RawTokenInfo>>()

  // Map to TokenInfo
  const tokensInfo: TokensInfo = {}
  for (const [tokenId, tokenInfo] of Object.entries(data)) {
    if (tokenInfo.networkId !== networkId) {
      continue
    }
    tokensInfo[tokenId] = {
      ...tokenInfo,
      priceUsd: toSerializedDecimalNumber(tokenInfo.priceUsd ?? 0),
    }
  }
  return tokensInfo
}

async function getERC20TokenInfo(
  address: Address,
  networkId: NetworkId,
): Promise<TokenInfo> {
  const imageUrl = ''
  const priceUsd = toSerializedDecimalNumber(0)

  if (isNative({ address, networkId })) {
    return {
      address: undefined,
      networkId,
      symbol: 'ETH',
      decimals: 18,
      imageUrl,
      priceUsd,
      tokenId: getTokenId({
        networkId: networkId,
        isNative: true,
        address: undefined, // address isn't used for native assets' token id at this time, but even if it was, we would probably not use 0xeee... because it is misleading and bug prone (no actual smart contract with that address exists) and not universal
      }),
    }
  }

  const erc20Contract = {
    address: address,
    abi: erc20Abi,
  } as const
  const [symbol, decimals] = await getClient(networkId).multicall({
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
    tokenId: getTokenId({ networkId: networkId, isNative: false, address }),
    networkId,
    address,
    symbol,
    decimals,
    priceUsd,
    imageUrl,
  }
}

function tokenWithUnderlyingBalance<T extends Token>(
  token: Omit<T, 'balance'>,
  balance: DecimalNumber,
  pricePerShare: DecimalNumber,
): T {
  const underlyingBalance = new BigNumber(balance).times(
    pricePerShare,
  ) as DecimalNumber

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
          underlyingBalance,
          new BigNumber(appToken.pricePerShare[i]) as DecimalNumber,
        )
      }),
    }),
    balance: toSerializedDecimalNumber(
      underlyingBalance.toFixed(token.decimals, BigNumber.ROUND_DOWN),
    ),
  } as T
}

function getDisplayProps(
  positionDefinition: PositionDefinition,
  resolvedTokensByTokenId: Record<string, Omit<Token, 'balance'>>,
): DisplayProps {
  if (typeof positionDefinition.displayProps === 'function') {
    return positionDefinition.displayProps({ resolvedTokensByTokenId })
  } else {
    return positionDefinition.displayProps
  }
}

async function resolveAppTokenPosition(
  address: string,
  positionDefinition: AppTokenPositionDefinition & { appId: string },
  tokensByTokenId: TokensInfo,
  resolvedTokensByTokenId: Record<string, Omit<Token, 'balance'>>,
  appInfo: AppInfo,
): Promise<AppTokenPosition> {
  let pricePerShare: DecimalNumber[]
  if (typeof positionDefinition.pricePerShare === 'function') {
    pricePerShare = await positionDefinition.pricePerShare({
      tokensByTokenId,
    })
  } else {
    pricePerShare = positionDefinition.pricePerShare
  }

  let priceUsd = new BigNumber(0)
  for (let i = 0; i < positionDefinition.tokens.length; i++) {
    const token = positionDefinition.tokens[i]
    const tokenInfo =
      tokensByTokenId[
        getTokenId({
          networkId: token.networkId,
          address: token.address,
        })
      ]
    priceUsd = priceUsd.plus(pricePerShare[i].times(tokenInfo.priceUsd))
  }

  const positionTokenInfo =
    tokensByTokenId[
      getTokenId({
        networkId: positionDefinition.networkId,
        isNative: false,
        address: positionDefinition.address,
      })
    ]!

  const appTokenContract = {
    address: positionDefinition.address as Address,
    abi: erc20Abi,
  } as const
  const [balance, totalSupply] = await getClient(
    positionDefinition.networkId,
  ).multicall({
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

  const displayProps = getDisplayProps(
    positionDefinition,
    resolvedTokensByTokenId,
  )

  const position: AppTokenPosition = {
    type: 'app-token',
    networkId: positionDefinition.networkId,
    address: positionDefinition.address,
    tokenId: getTokenId({
      networkId: positionDefinition.networkId,
      isNative: false,
      address: positionDefinition.address,
    }),
    appId: positionDefinition.appId,
    appName: appInfo.name,
    symbol: positionTokenInfo.symbol,
    decimals: positionTokenInfo.decimals,
    label: displayProps.title,
    displayProps,
    tokens: positionDefinition.tokens.map((token, i) =>
      tokenWithUnderlyingBalance(
        resolvedTokensByTokenId[
          getTokenId({
            networkId: token.networkId,
            address: token.address,
          })
        ],
        toDecimalNumber(balance, positionTokenInfo.decimals),
        pricePerShare[i],
      ),
    ),
    pricePerShare: pricePerShare.map(toSerializedDecimalNumber),
    priceUsd: toSerializedDecimalNumber(priceUsd),
    balance: toSerializedDecimalNumber(
      toDecimalNumber(balance, positionTokenInfo.decimals),
    ),
    supply: toSerializedDecimalNumber(
      toDecimalNumber(totalSupply, positionTokenInfo.decimals),
    ),
    availableShortcutIds: positionDefinition.availableShortcutIds ?? [],
  }

  return position
}

async function resolveContractPosition(
  _address: string,
  positionDefinition: ContractPositionDefinition & { appId: string },
  _tokensByAddress: TokensInfo,
  resolvedTokensByTokenId: Record<string, Omit<Token, 'balance'>>,
  appInfo: AppInfo,
): Promise<ContractPosition> {
  let balances: DecimalNumber[]
  if (typeof positionDefinition.balances === 'function') {
    balances = await positionDefinition.balances({
      resolvedTokensByTokenId,
    })
  } else {
    balances = positionDefinition.balances
  }

  const tokens = positionDefinition.tokens.map((token, i) =>
    tokenWithUnderlyingBalance(
      {
        ...resolvedTokensByTokenId[
          getTokenId({
            networkId: token.networkId,
            address: token.address,
          })
        ],
        ...(token.category && { category: token.category }),
      },
      balances[i],
      new BigNumber(1) as DecimalNumber,
    ),
  )

  let balanceUsd = new BigNumber(0)
  for (let i = 0; i < positionDefinition.tokens.length; i++) {
    const token = positionDefinition.tokens[i]
    const tokenId = getTokenId({
      networkId: token.networkId,
      address: token.address,
    })
    const tokenInfo = resolvedTokensByTokenId[tokenId]
    balanceUsd = balanceUsd.plus(balances[i].times(tokenInfo.priceUsd))
  }

  const displayProps = getDisplayProps(
    positionDefinition,
    resolvedTokensByTokenId,
  )

  const position: ContractPosition = {
    type: 'contract-position',
    address: positionDefinition.address,
    networkId: positionDefinition.networkId,
    appId: positionDefinition.appId,
    appName: appInfo.name,
    label: displayProps.title,
    displayProps,
    tokens: tokens,
    balanceUsd: toSerializedDecimalNumber(balanceUsd),
    availableShortcutIds: positionDefinition.availableShortcutIds ?? [],
  }

  return position
}

function addAppId<T>(definition: T, appId: string) {
  return {
    ...definition,
    appId,
  }
}

function addSourceAppId<T>(definition: T, sourceAppId: string) {
  return {
    ...definition,
    sourceAppId,
  }
}

// This is the main logic to get positions
export async function getPositions(
  networkId: NetworkId,
  address: string,
  appIds: string[] = [],
  getTokensInfoUrl: string,
) {
  const hooksByAppId = await getHooks(appIds, 'positions')

  // First get all position definitions for the given address
  const definitions = await Promise.all(
    Object.entries(hooksByAppId).map(([appId, hook]) =>
      hook.getPositionDefinitions(networkId, address).then(
        (definitions) => {
          return definitions.map((definition) => addAppId(definition, appId))
        },
        (err) => {
          // In case of an error, log and return an empty array
          // so other positions can still be resolved
          logger.error(
            { err },
            `Failed to get position definitions for ${appId}`,
          )
          return []
        },
      ),
    ),
  ).then((definitions) => definitions.flat())
  logger.debug({ definitions }, 'positions definitions')

  // Get the base tokens info
  const baseTokensInfo = await getBaseTokensInfo(getTokensInfoUrl, networkId)

  let unlistedBaseTokensInfo: TokensInfo = {}
  let definitionsToResolve: AppPositionDefinition[] = definitions
  const visitedDefinitions: DefinitionsByTokenId = {}
  while (true) {
    // Visit each definition we haven't visited yet
    definitionsToResolve = definitionsToResolve.filter((definition) => {
      const definitionTokenId = getTokenId({
        networkId: definition.networkId,
        address: definition.address,
      })

      if (visitedDefinitions[definitionTokenId]) {
        return false
      }
      visitedDefinitions[definitionTokenId] = definition
      return true
    })

    if (definitionsToResolve.length === 0) {
      logger.debug('No more positions to resolve')
      break
    }

    // Resolve token definitions to tokens
    const allTokenDefinitions = definitionsToResolve.flatMap((position) =>
      position.tokens.map((token) => addSourceAppId(token, position.appId)),
    )

    logger.debug({ allTokenDefinitions }, 'allTokenDefinitions')

    // Get the tokens definitions for which we don't have the base token info or position definition
    const unresolvedTokenDefinitions = allTokenDefinitions.filter(
      (definition) => {
        const definitionTokenId = getTokenId({
          networkId: definition.networkId,
          address: definition.address,
        })
        return (
          !{ ...baseTokensInfo, ...unlistedBaseTokensInfo }[
            definitionTokenId
          ] && !visitedDefinitions[definitionTokenId]
        )
      },
    )

    logger.debug({ unresolvedTokenDefinitions }, 'unresolvedTokenDefinitions')

    // Get the token info for the unresolved token definitions
    const newUnlistedBaseTokensInfo: TokensInfo = {}
    const appTokenDefinitions = (
      await Promise.all(
        unresolvedTokenDefinitions.map(async (tokenDefinition) => {
          try {
            // Assume the token is an app token from the hook
            // TODO: We'll probably need to allow hooks to specify the app id themselves
            const { sourceAppId } = tokenDefinition
            const hook = hooksByAppId[sourceAppId]
            if (!hook.getAppTokenDefinition) {
              throw new Error(
                `Positions hook for app '${sourceAppId}' does not implement 'getAppTokenDefinition'. Please implement it to resolve the intermediary app token definition for ${tokenDefinition.address} (${tokenDefinition.networkId}).`,
              )
            }
            const appTokenDefinition = await hook
              .getAppTokenDefinition(tokenDefinition)
              .then((definition) => addAppId(definition, sourceAppId))
            return appTokenDefinition
          } catch (e) {
            if (e instanceof ContractFunctionExecutionError) {
              // Assume the token is an ERC20 token
              const erc20TokenInfo = await getERC20TokenInfo(
                tokenDefinition.address as Address,
                networkId,
              )
              newUnlistedBaseTokensInfo[erc20TokenInfo.tokenId] = erc20TokenInfo
              return
            }
            throw e
          }
        }),
      )
    ).filter((p): p is Exclude<typeof p, null | undefined> => p != null)

    logger.debug({ appTokenDefinitions }, 'appTokenDefinitions')
    logger.debug({ newUnlistedBaseTokensInfo }, 'newUnlistedBaseTokensInfo')

    unlistedBaseTokensInfo = {
      ...unlistedBaseTokensInfo,
      ...newUnlistedBaseTokensInfo,
    }

    // Get the definitions to resolve for the next iteration
    definitionsToResolve = appTokenDefinitions
  }

  logger.debug({
    unlistedBaseTokensInfo,
    visitedPositions: visitedDefinitions,
  })

  const baseTokensByTokenId: TokensInfo = {
    ...baseTokensInfo,
    ...unlistedBaseTokensInfo,
  }
  const appTokensInfo = await Promise.all(
    Object.values(visitedDefinitions)
      .filter(
        (position): position is AppPositionDefinition =>
          position?.type === 'app-token-definition' &&
          !baseTokensByTokenId[
            getTokenId({
              networkId: position.networkId,
              address: position.address,
            })
          ],
      )
      .map((definition) =>
        getERC20TokenInfo(definition.address as Address, definition.networkId),
      ),
  )
  const appTokensByTokenId: TokensInfo = {}
  for (const tokenInfo of appTokensInfo) {
    appTokensByTokenId[tokenInfo.tokenId] = tokenInfo
  }

  const tokensByTokenId: TokensInfo = {
    ...baseTokensByTokenId,
    ...appTokensByTokenId,
  }

  // We now have all the base tokens info and position definitions
  // including intermediary app tokens definitions
  // We can now resolve the positions

  // Start with the base tokens
  const resolvedTokensByTokenId: Record<string, Omit<Token, 'balance'>> = {}
  for (const token of Object.values(baseTokensByTokenId)) {
    if (!token) {
      continue
    }
    resolvedTokensByTokenId[token.tokenId] = {
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

    logger.debug('Resolving definition', type, positionDefinition.address)

    const appInfo = hooksByAppId[positionDefinition.appId].getInfo()

    let position: Position
    switch (type) {
      case 'app-token-definition':
        position = await resolveAppTokenPosition(
          address,
          positionDefinition,
          tokensByTokenId,
          resolvedTokensByTokenId,
          appInfo,
        )
        resolvedTokensByTokenId[position.tokenId] = position
        break
      case 'contract-position-definition':
        position = await resolveContractPosition(
          address,
          positionDefinition,
          tokensByTokenId,
          resolvedTokensByTokenId,
          appInfo,
        )
        break
      default:
        const assertNever: never = type
        return assertNever
    }

    resolvedPositions[
      getTokenId({
        networkId: positionDefinition.networkId,
        address: positionDefinition.address,
      })
    ] = position
  }

  return definitions.map((definition) => {
    const definitionTokenId = getTokenId({
      networkId: definition.networkId,
      isNative: false,
      address: definition.address,
    })
    const resolvedPosition = resolvedPositions[definitionTokenId]
    // Sanity check
    if (!resolvedPosition) {
      throw new Error(
        `Could not resolve ${definition.type} with token id ${definitionTokenId}`,
      )
    }
    return resolvedPosition
  })
}
