import { setupServer } from 'msw/node'
import { rest } from 'msw'

const handlers = [
  rest.get(
    'https://us-central1-celo-mobile-mainnet.cloudfunctions.net/getRtdbTokensInfo',
    async (_req, res, ctx) => {
      return res(
        ctx.json({
          tokens: {
            '0x471ece3750da237f93b8e339c536989b8978a438': {
              address: '0x471ece3750da237f93b8e339c536989b8978a438',
              name: 'Celo native asset',
              symbol: 'CELO',
              decimals: 18,
              usdPrice: '0.58326592153266402092',
              imageUrl:
                'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/CELO.png',
            },
            '0x765de816845861e75a25fca122bb6898b8b1282a': {
              address: '0x765de816845861e75a25fca122bb6898b8b1282a',
              name: 'Celo Dollar',
              symbol: 'cUSD',
              decimals: 18,
              usdPrice: '1',
              imageUrl:
                'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/cUSD.png',
            },
          },
        }),
      )
    },
  ),
  rest.get(
    'https://api.curve.fi/v1/getPools/all/celo',
    async (_req, res, ctx) => {
      return res(
        ctx.json({
          success: true,
          data: {
            poolData: [
              // truncated list from actual test query to curve api https://api.curve.fi/v1/documentation/#/Pools/get_getPools__blockchainId___registryId_
              {
                id: 'factory-v2-0',
                address: '0x998395fEd908d33CF27115A1D9Ab6555def6cd45',
                coinsAddresses: [
                  '0x90Ca507a5D4458a4C6C6249d186b6dCb02a5BCCd',
                  '0xef4229c8c3250C675F21BCefa42f58EfbfF6002a',
                  '0x88eeC49252c8cbc039DCdB394c0c2BA2f1637EA0',
                  '0x0000000000000000000000000000000000000000',
                ],
                decimals: ['18', '6', '6', '0'],
                virtualPrice: 0,
                amplificationCoefficient: '400',
                totalSupply: '0',
                name: 'Curve.fi Factory Plain Pool: DAI/USDC/USDT',
                assetType: '0',
                implementationAddress:
                  '0xBcdCADB91446366d10b293152c967e64dE789B92',
                symbol: 'celo-3CRV-f',
                implementation: 'plain3basic',
                assetTypeName: 'usd',
                coins: [
                  {
                    address: '0x90Ca507a5D4458a4C6C6249d186b6dCb02a5BCCd',
                    usdPrice: 0.999668,
                    decimals: '18',
                    isBasePoolLpToken: false,
                    symbol: 'DAI',
                    poolBalance: '0',
                  },
                  {
                    address: '0xef4229c8c3250C675F21BCefa42f58EfbfF6002a',
                    usdPrice: 1,
                    decimals: '6',
                    isBasePoolLpToken: false,
                    symbol: 'USDC',
                    poolBalance: '0',
                  },
                  {
                    address: '0x88eeC49252c8cbc039DCdB394c0c2BA2f1637EA0',
                    usdPrice: 1.001,
                    decimals: '6',
                    isBasePoolLpToken: false,
                    symbol: 'USDT',
                    poolBalance: '0',
                  },
                ],
                poolUrls: {
                  swap: [
                    'https://curve.fi/#/celo/pools/factory-v2-0/swap',
                    'https://celo.curve.fi/factory/0',
                  ],
                  deposit: [
                    'https://curve.fi/#/celo/pools/factory-v2-0/deposit',
                    'https://celo.curve.fi/factory/0/deposit',
                  ],
                  withdraw: [
                    'https://curve.fi/#/celo/pools/factory-v2-0/withdraw',
                    'https://celo.curve.fi/factory/0/withdraw',
                  ],
                },
                lpTokenAddress: '0x998395fEd908d33CF27115A1D9Ab6555def6cd45',
                usdTotal: 0,
                isMetaPool: false,
                usdTotalExcludingBasePool: 0,
                usesRateOracle: false,
                isBroken: false,
              },
              {
                id: 'factory-v2-1',
                address: '0x32fD7e563c6521Ab4D59CE3277bcfBe3317CFd63',
                coinsAddresses: [
                  '0x765DE816845861e75A25fCA122bb6898B8B1282a',
                  '0x37f750B7cC259A2f741AF45294f6a16572CF5cAd',
                  '0x617f3112bf5397D0467D315cC709EF968D9ba546',
                  '0x0000000000000000000000000000000000000000',
                ],
                decimals: ['18', '6', '6', '0'],
                virtualPrice: '1004058888587887603',
                amplificationCoefficient: '200',
                totalSupply: '676201839080639239053585',
                name: 'Curve.fi Factory Plain Pool: tripool',
                assetType: '0',
                implementationAddress:
                  '0xBcdCADB91446366d10b293152c967e64dE789B92',
                symbol: 'cUSD3pool-f',
                implementation: 'plain3basic',
                assetTypeName: 'usd',
                coins: [
                  {
                    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
                    usdPrice: 0.998744,
                    decimals: '18',
                    isBasePoolLpToken: false,
                    symbol: 'cUSD',
                    poolBalance: '267854857910499123887035',
                  },
                  {
                    address: '0x37f750B7cC259A2f741AF45294f6a16572CF5cAd',
                    usdPrice: 1,
                    decimals: '6',
                    isBasePoolLpToken: false,
                    symbol: 'USDC',
                    poolBalance: '223714127573',
                  },
                  {
                    address: '0x617f3112bf5397D0467D315cC709EF968D9ba546',
                    usdPrice: 1.000605,
                    decimals: '6',
                    isBasePoolLpToken: false,
                    symbol: 'USDT',
                    poolBalance: '187413876091',
                  },
                ],
                poolUrls: {
                  swap: [
                    'https://curve.fi/#/celo/pools/factory-v2-1/swap',
                    'https://celo.curve.fi/factory/1',
                  ],
                  deposit: [
                    'https://curve.fi/#/celo/pools/factory-v2-1/deposit',
                    'https://celo.curve.fi/factory/1/deposit',
                  ],
                  withdraw: [
                    'https://curve.fi/#/celo/pools/factory-v2-1/withdraw',
                    'https://celo.curve.fi/factory/1/withdraw',
                  ],
                },
                lpTokenAddress: '0x32fD7e563c6521Ab4D59CE3277bcfBe3317CFd63',
                usdTotal: 678759.8212679987,
                isMetaPool: false,
                usdTotalExcludingBasePool: 678759.8212679987,
                gaugeAddress: '0x18c45c10a0f41bc3ed8d6324c687335179a40b28',
                usesRateOracle: false,
                isBroken: false,
              },
              {
                id: 'factory-v2-2',
                address: '0xAF7Ee5Ba02dC9879D24cb16597cd854e13f3aDa8',
                coinsAddresses: [
                  '0xC16B81Af351BA9e64C1a069E3Ab18c244A1E3049',
                  '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
                  '0x0000000000000000000000000000000000000000',
                  '0x0000000000000000000000000000000000000000',
                ],
                decimals: ['18', '18', '0', '0'],
                virtualPrice: '17383049386256554431',
                amplificationCoefficient: '200',
                totalSupply: '35476026966646549',
                name: 'Curve.fi Factory Plain Pool: agEUR/cEUR',
                assetType: '3',
                implementationAddress:
                  '0xfEE7166C32Bdf6356Ef60636f43400AA55551A96',
                symbol: 'agEURcEUR-f',
                implementation: 'plain2basic',
                assetTypeName: 'other',
                coins: [
                  {
                    address: '0xC16B81Af351BA9e64C1a069E3Ab18c244A1E3049',
                    usdPrice: 1.094,
                    decimals: '18',
                    isBasePoolLpToken: false,
                    symbol: 'agEUR',
                    poolBalance: '460008637212874997',
                  },
                  {
                    address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
                    usdPrice: 1.092,
                    decimals: '18',
                    isBasePoolLpToken: false,
                    symbol: 'cEUR',
                    poolBalance: '157158676672396128',
                  },
                ],
                poolUrls: {
                  swap: [
                    'https://curve.fi/#/celo/pools/factory-v2-2/swap',
                    'https://celo.curve.fi/factory/2',
                  ],
                  deposit: [
                    'https://curve.fi/#/celo/pools/factory-v2-2/deposit',
                    'https://celo.curve.fi/factory/2/deposit',
                  ],
                  withdraw: [
                    'https://curve.fi/#/celo/pools/factory-v2-2/withdraw',
                    'https://celo.curve.fi/factory/2/withdraw',
                  ],
                },
                lpTokenAddress: '0xAF7Ee5Ba02dC9879D24cb16597cd854e13f3aDa8',
                usdTotal: 0.6748667240371419,
                isMetaPool: false,
                usdTotalExcludingBasePool: 0.6748667240371419,
                gaugeAddress: '0x1f207d9235ab7667d38dceef9e75862cac6900a9',
                gaugeRewards: [],
                gaugeCrvApy: [0, 0],
                usesRateOracle: false,
                isBroken: false,
              },
            ],
            tvlAll: 20709605.184946403,
            tvl: 20709605.184946403,
          },
          generatedTimeMs: 1710357358479,
        }),
      )
    },
  ),
  rest.get(
    'https://api.curve.fi/v1/getPools/all/ethereum',
    async (_req, res, ctx) => {
      return res(
        ctx.json({
          success: true,
          data: {
            poolData: [
              // truncated list from actual test query to curve api https://api.curve.fi/v1/documentation/#/Pools/get_getPools__blockchainId___registryId_
              {
                id: 'factory-v2-0',
                address: '0x1F71f05CF491595652378Fe94B7820344A551B8E',
                coinsAddresses: [
                  '0x96E61422b6A9bA0e068B6c5ADd4fFaBC6a4aae27',
                  '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51',
                  '0x0000000000000000000000000000000000000000',
                  '0x0000000000000000000000000000000000000000',
                ],
                decimals: ['18', '18', '0', '0'],
                virtualPrice: 0,
                amplificationCoefficient: '100',
                totalSupply: '20000000000000000',
                name: 'Curve.fi Factory Plain Pool: ibEUR/sEUR',
                assetType: '99',
                implementationAddress:
                  '0x6523Ac15EC152Cb70a334230F6c5d62C5Bd963f1',
                symbol: 'ibEUR+sEUR-f',
                implementation: 'plain2basic',
                assetTypeName: 'unknown',
                coins: [
                  {
                    address: '0x96E61422b6A9bA0e068B6c5ADd4fFaBC6a4aae27',
                    usdPrice: 1.0293825320572565,
                    decimals: '18',
                    isBasePoolLpToken: false,
                    symbol: 'ibEUR',
                    poolBalance: '2440147371390294759297',
                  },
                  {
                    address: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51',
                    usdPrice: 1.0017291207272516,
                    decimals: '18',
                    isBasePoolLpToken: false,
                    symbol: 'sUSD',
                    poolBalance: '2182087364350',
                  },
                ],
                poolUrls: {
                  swap: [
                    'https://curve.fi/#/ethereum/pools/factory-v2-0/swap',
                    'https://classic.curve.fi/factory/0',
                  ],
                  deposit: [
                    'https://curve.fi/#/ethereum/pools/factory-v2-0/deposit',
                    'https://classic.curve.fi/factory/0/deposit',
                  ],
                  withdraw: [
                    'https://curve.fi/#/ethereum/pools/factory-v2-0/withdraw',
                    'https://classic.curve.fi/factory/0/withdraw',
                  ],
                },
                lpTokenAddress: '0x1F71f05CF491595652378Fe94B7820344A551B8E',
                usdTotal: 2511.8450819404607,
                isMetaPool: false,
                usdTotalExcludingBasePool: 2511.8450819404607,
                usesRateOracle: false,
                isBroken: false,
              },
              {
                id: 'factory-v2-145',
                address: '0xe7A3b38c39F97E977723bd1239C3470702568e7B',
                coinsAddresses: [
                  '0xEE586e7Eaad39207F0549BC65f19e336942C992f',
                  '0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8',
                  '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
                  '0x0000000000000000000000000000000000000000',
                ],
                decimals: ['18', '18', '6', '0'],
                virtualPrice: '1003840784416721236',
                amplificationCoefficient: '10',
                totalSupply: '207711420092740613091153',
                name: 'Curve.fi Factory Plain Pool: Euro Pool',
                assetType: '3',
                implementationAddress:
                  '0x9B52F13DF69D79Ec5aAB6D1aCe3157d29B409cC3',
                symbol: 'europool-f',
                implementation: 'plain3basic',
                assetTypeName: 'other',
                coins: [
                  {
                    address: '0xEE586e7Eaad39207F0549BC65f19e336942C992f',
                    usdPrice: 1.0693998825835587,
                    decimals: '18',
                    isBasePoolLpToken: false,
                    symbol: 'cEUR',
                    poolBalance: '77041895193731946061232',
                  },
                  {
                    address: '0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8',
                    usdPrice: 1.086,
                    decimals: '18',
                    isBasePoolLpToken: false,
                    symbol: 'EURA',
                    poolBalance: '67538628832312070530528',
                  },
                  {
                    address: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
                    usdPrice: 1.082,
                    decimals: '6',
                    isBasePoolLpToken: false,
                    symbol: 'EURC',
                    poolBalance: '63987165776',
                  },
                ],
                poolUrls: {
                  swap: [
                    'https://curve.fi/#/ethereum/pools/factory-v2-145/swap',
                    'https://classic.curve.fi/factory/145',
                  ],
                  deposit: [
                    'https://curve.fi/#/ethereum/pools/factory-v2-145/deposit',
                    'https://classic.curve.fi/factory/145/deposit',
                  ],
                  withdraw: [
                    'https://curve.fi/#/ethereum/pools/factory-v2-145/withdraw',
                    'https://classic.curve.fi/factory/145/withdraw',
                  ],
                },
                lpTokenAddress: '0xe7A3b38c39F97E977723bd1239C3470702568e7B',
                usdTotal: 224969.65795571468,
                isMetaPool: false,
                usdTotalExcludingBasePool: 224969.65795571468,
                gaugeAddress: '0x9f57569eaa61d427deeebac8d9546a745160391c',
                gaugeRewards: [],
                gaugeCrvApy: [0.06816638061949697, 0.17041595154874242],
                gaugeFutureCrvApy: [0.06798905631851226, 0.16997264079628066],
                usesRateOracle: false,
                isBroken: false,
              },
            ],
          },
        }),
      )
    },
  ),
]

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...handlers)
