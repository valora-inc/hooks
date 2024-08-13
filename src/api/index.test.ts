import request from 'supertest'
// See https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/461#issuecomment-1184147725
// Using the workaround with NodeNext module resolution causes a cascade of other issues
// @ts-expect-error
import { getTestServer } from '@google-cloud/functions-framework/testing'
import { getPositions } from '../runtime/getPositions'
import { getShortcuts } from '../runtime/getShortcuts'
import { Position } from '../types/positions'
import { SerializedDecimalNumber } from '../types/numbers'
import { NetworkId } from '../types/networkId'
import { getConfig } from '../config'

jest.mock('../config')
jest.mocked(getConfig).mockReturnValue({
  POSITION_IDS: [],
  GET_TOKENS_INFO_URL: 'https://valoraapp.com/mock-endpoint',
  GOOGLE_CLOUD_PROJECT: 'dev-project',
  SHORTCUT_IDS: [],
  NETWORK_ID_TO_RPC_URL: {},
  EARN_SUPPORTED_NETWORK_IDS: [NetworkId['celo-mainnet'], NetworkId['arbitrum-one']],
})
import './index' // NOTE: there are side effects of importing this module-- loading config params from the environment in particular. so mocking configs MUST be done before importing.
import { ZodAddressLowerCased } from '../types/address'
jest.mock('../runtime/getPositions')
jest.mock('../runtime/getShortcuts')

const TEST_POSITIONS_CELO: Position[] = [
  {
    type: 'app-token',
    appId: 'ubeswap',
    appName: 'Ubeswap',
    networkId: NetworkId['celo-mainnet'],
    address: '0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf',
    positionId: 'celo-mainnet:0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf',
    symbol: 'ULP',
    decimals: 18,
    label: 'Pool: G$ / cUSD',
    displayProps: {
      title: 'G$ / cUSD',
      description: 'Pool',
      imageUrl: '',
    },
    tokenId: 'celo-mainnet:0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf',
    tokens: [
      {
        type: 'base-token',
        networkId: NetworkId['celo-mainnet'],
        address: '0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a',
        symbol: 'G$',
        decimals: 18,
        priceUsd: '0.00015738574843135427' as SerializedDecimalNumber,
        balance: '12445.060074286696111325' as SerializedDecimalNumber,
        tokenId: 'celo-mainnet:0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a',
      },
      {
        type: 'base-token',
        networkId: NetworkId['celo-mainnet'],
        address: '0x765de816845861e75a25fca122bb6898b8b1282a',
        symbol: 'cUSD',
        decimals: 18,
        priceUsd: '1' as SerializedDecimalNumber,
        balance: '2.061316226302041758' as SerializedDecimalNumber,
        tokenId: 'celo-mainnet:0x765de816845861e75a25fca122bb6898b8b1282a',
      },
    ],
    pricePerShare: [
      '77.77845724145984437582' as SerializedDecimalNumber,
      '0.0128827016512212377' as SerializedDecimalNumber,
    ],
    priceUsd: '0.0130404016454077124' as SerializedDecimalNumber,
    balance: '160.006517430032680046' as SerializedDecimalNumber,
    supply: '170.324243277473535226' as SerializedDecimalNumber,
    availableShortcutIds: [],
  },
]

const TEST_POSITIONS_ETHEREUM: Position[] = [
  {
    type: 'app-token',
    appId: 'uniswap',
    appName: 'Uniswap',
    networkId: NetworkId['ethereum-mainnet'],
    address: '0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf',
    positionId: 'ethereum-mainnet:0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf',
    symbol: 'ULP',
    decimals: 18,
    label: 'Pool: UNI / USDC',
    displayProps: {
      title: 'UNI / USDC',
      description: 'Pool',
      imageUrl: '',
    },
    tokenId: 'ethereum-mainnet:0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf',
    tokens: [
      {
        type: 'base-token',
        networkId: NetworkId['celo-mainnet'],
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        symbol: 'UNI',
        decimals: 18,
        priceUsd: '11.17' as SerializedDecimalNumber,
        balance: '12445.060074286696111325' as SerializedDecimalNumber,
        tokenId: 'ethereum-mainnet:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      },
      {
        type: 'base-token',
        networkId: NetworkId['celo-mainnet'],
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        decimals: 18,
        priceUsd: '1' as SerializedDecimalNumber,
        balance: '2.061316226302041758' as SerializedDecimalNumber,
        tokenId: 'ethereum-mainnet:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      },
    ],
    pricePerShare: [
      '1.77845724145984437582' as SerializedDecimalNumber,
      '2.0128827016512212377' as SerializedDecimalNumber,
    ],
    priceUsd: '0.25' as SerializedDecimalNumber,
    balance: '100.01' as SerializedDecimalNumber,
    supply: '170.10' as SerializedDecimalNumber,
    availableShortcutIds: [],
  },
]

const TEST_POSITIONS_ARBITRUM: Position[] = [
  {
    type: 'app-token',
    networkId: NetworkId['arbitrum-one'],
    address: '0x724dc807b04555b71ed48a6896b6f41593b8c637',
    tokenId: 'arbitrum-one:0x724dc807b04555b71ed48a6896b6f41593b8c637',
    positionId: 'arbitrum-one:0x724dc807b04555b71ed48a6896b6f41593b8c637',
    appId: 'aave',
    appName: 'Aave',
    symbol: 'aArbUSDCn',
    decimals: 6,
    label: 'USDC',
    displayProps: {
      title: 'USDC',
      description: 'Supplied (APY: 7.42%)',
      imageUrl:
        'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/aave.png',
    },
    dataProps: {
      yieldRates: [
        {
          percentage: 7.419092396389471,
          label: 'Earnings APY',
          tokenId: 'arbitrum-one:0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        },
      ],
      earningItems: [],
      depositTokenId: 'arbitrum-one:0xaf88d065e77c8cc2239327c5edb3a432268e5831',
      withdrawTokenId:
        'arbitrum-one:0x724dc807b04555b71ed48a6896b6f41593b8c637',
    },
    tokens: [
      {
        address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        decimals: 6,
        symbol: 'USDC',
        networkId: NetworkId['arbitrum-one'],
        tokenId: 'arbitrum-one:0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        priceUsd: '1' as SerializedDecimalNumber,
        type: 'base-token',
        balance: '0' as SerializedDecimalNumber,
      },
    ],
    pricePerShare: ['1' as SerializedDecimalNumber],
    priceUsd: '1' as SerializedDecimalNumber,
    balance: '0' as SerializedDecimalNumber,
    supply: '239859963.713137' as SerializedDecimalNumber,
    availableShortcutIds: ['deposit', 'withdraw'],
  },
]

const TEST_POSITIONS_CELO_EARN: Position[] = [
  {
    type: 'app-token',
    networkId: NetworkId['celo-mainnet'],
    address: '0xfb2c7c10e731ebe96dabdf4a96d656bfe8e2b5af',
    tokenId: 'celo-mainnet:0xfb2c7c10e731ebe96dabdf4a96d656bfe8e2b5af',
    positionId: 'celo-mainnet:0xfb2c7c10e731ebe96dabdf4a96d656bfe8e2b5af',
    appId: 'allbridge',
    appName: 'Allbridge',
    symbol: 'LP-USDT',
    decimals: 6,
    label: 'USDT',
    displayProps: {
      title: 'USDT',
      description: 'Supplied (APR: 2.61%)',
      imageUrl:
        'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/allbridgecore.png',
    },
    dataProps: {
      yieldRates: [
        {
          percentage: 2.61,
          label: 'Earnings APR',
          tokenId: 'celo-mainnet:0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
        },
      ],
      earningItems: [],
      depositTokenId: 'celo-mainnet:0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
      withdrawTokenId:
        'celo-mainnet:0xfb2c7c10e731ebe96dabdf4a96d656bfe8e2b5af',
    },
    tokens: [
      {
        address: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
        decimals: 6,
        symbol: 'USDT',
        networkId: NetworkId['celo-mainnet'],
        tokenId: 'celo-mainnet:0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
        priceUsd: '1' as SerializedDecimalNumber,
        type: 'base-token',
        balance: '0' as SerializedDecimalNumber,
      },
    ],
    pricePerShare: ['1' as SerializedDecimalNumber],
    priceUsd: '1' as SerializedDecimalNumber,
    balance: '0' as SerializedDecimalNumber,
    supply: '239859963.713137' as SerializedDecimalNumber,
    availableShortcutIds: ['deposit', 'withdraw'],
  },
]

jest.mocked(getPositions).mockImplementation(async (networkId) => {
  if (networkId === NetworkId['celo-mainnet']) {
    return TEST_POSITIONS_CELO
  } else if (networkId === NetworkId['ethereum-mainnet']) {
    return TEST_POSITIONS_ETHEREUM
  } else if (networkId === NetworkId['arbitrum-one']) {
    return TEST_POSITIONS_ARBITRUM
  } else {
    return []
  }
})

const TEST_SHORTCUTS: Awaited<ReturnType<typeof getShortcuts>> = [
  {
    appId: 'ubeswap',
    id: 'claim-reward',
    name: 'Claim',
    description: 'Claim rewards for staked liquidity',
    networkIds: [NetworkId['celo-mainnet']],
    category: 'claim',
    triggerInputShape: {
      positionAddress: ZodAddressLowerCased,
    },
    async onTrigger({ networkId, address, positionAddress }) {
      // Bogus implementation for testing
      return [
        {
          networkId,
          from: address,
          to: positionAddress,
          data: '0xTEST',
        },
      ]
    },
  },
]

jest.mocked(getShortcuts).mockResolvedValue(TEST_SHORTCUTS)

const WALLET_ADDRESS = '0x0000000000000000000000000000000000007e57'

describe('GET /getPositions', () => {
  it('returns balances for celo', async () => {
    const server = getTestServer('hooks-api')
    await request(server)
      .get('/getPositions')
      .query({
        networkIds: [NetworkId['celo-mainnet']],
        address: WALLET_ADDRESS,
      })
      .expect(200)
      .expect({ message: 'OK', data: TEST_POSITIONS_CELO })
  })

  it('returns balances for celo and ethereum', async () => {
    const server = getTestServer('hooks-api')
    await request(server)
      .get('/getPositions')
      .query({
        networkIds: [NetworkId['celo-mainnet'], NetworkId['ethereum-mainnet']],
        address: WALLET_ADDRESS,
      })
      .expect(200)
      .expect({
        message: 'OK',
        data: TEST_POSITIONS_CELO.concat(TEST_POSITIONS_ETHEREUM),
      })
  })

  it('returns all positions when address is not provided', async () => {
    const server = getTestServer('hooks-api')
    const response = await request(server)
      .get('/getPositions')
      .query({
        network: 'celo', // note: this old schema should still be supported.
      })
      .expect(200)
    expect(response.body).toStrictEqual({
      message: 'OK',
      data: TEST_POSITIONS_CELO,
    })
  })
})

describe('GET /getEarnPositions', () => {
  it('returns earn positions for arbitrum', async () => {
    const server = getTestServer('hooks-api')
    const response = await request(server)
      .get('/getEarnPositions')
      .query({
        networkIds: [NetworkId['arbitrum-one']],
        address: WALLET_ADDRESS,
      })
      .expect(200)
    expect(response.body).toEqual({
      message: 'OK',
      data: TEST_POSITIONS_ARBITRUM,
    })
  })
  it('returns earn positions for celo', async () => {
    jest.mocked(getPositions).mockResolvedValue(TEST_POSITIONS_CELO_EARN)
    const server = getTestServer('hooks-api')
    const response = await request(server)
      .get('/getEarnPositions')
      .query({
        networkIds: [NetworkId['celo-mainnet']],
        address: WALLET_ADDRESS,
      })
      .expect(200)
    expect(response.body).toEqual({
      message: 'OK',
      data: TEST_POSITIONS_CELO_EARN,
    })
  })
})

describe('GET /getShortcuts', () => {
  it('returns shortcuts', async () => {
    const server = getTestServer('hooks-api')
    const response = await request(server).get('/getShortcuts').expect(200)
    expect(response.body).toEqual({
      message: 'OK',
      data: TEST_SHORTCUTS.map(
        ({ onTrigger, triggerInputShape, ...shortcut }) => ({
          ...shortcut,
        }),
      ),
    })
  })
})

describe('POST /triggerShortcut', () => {
  it('calls the shortcut onTrigger and returns transactions', async () => {
    const server = getTestServer('hooks-api')
    const response = await request(server)
      .post('/triggerShortcut')
      .send({
        networkId: 'celo-mainnet',
        address: WALLET_ADDRESS,
        appId: TEST_SHORTCUTS[0].appId,
        shortcutId: TEST_SHORTCUTS[0].id,
        positionAddress: TEST_POSITIONS_CELO[0].address,
      })
      .expect(200)
    expect(response.body).toEqual({
      message: 'OK',
      data: {
        transactions: [
          {
            networkId: 'celo-mainnet',
            from: WALLET_ADDRESS.toLowerCase(),
            to: TEST_POSITIONS_CELO[0].address,
            data: '0xTEST',
          },
        ],
      },
    })
  })

  it("returns 400 when the shortcut doesn't exist", async () => {
    const server = getTestServer('hooks-api')
    const response = await request(server)
      .post('/triggerShortcut')
      .send({
        networkId: 'celo-mainnet',
        address: WALLET_ADDRESS,
        appId: TEST_SHORTCUTS[0].appId,
        shortcutId: 'flarf',
        positionAddress: TEST_POSITIONS_CELO[0].address,
      })
      .expect(400)
    expect(response.body).toMatchInlineSnapshot(`
      {
        "message": "No shortcut found with id 'flarf' for app 'ubeswap', available shortcuts: claim-reward",
      }
    `)
  })

  it("returns 400 when the shortcut trigger inputs don't match the schema", async () => {
    const server = getTestServer('hooks-api')
    const response = await request(server)
      .post('/triggerShortcut')
      .send({
        networkId: 'celo-mainnet',
        address: WALLET_ADDRESS,
        appId: TEST_SHORTCUTS[0].appId,
        shortcutId: TEST_SHORTCUTS[0].id,
        positionAddress: 'barf',
      })
      .expect(400)
    expect(response.body).toStrictEqual({
      details: {
        _errors: [],
        body: {
          _errors: [],
          positionAddress: {
            _errors: ['Invalid Address barf'],
          },
        },
      },
      message: 'Invalid request',
    })
  })
})
