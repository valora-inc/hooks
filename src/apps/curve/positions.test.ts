import { getAllCurvePools } from './positions'
import { NetworkId } from '../../api/networkId'

jest.mock('got', () => ({
  get: jest.fn().mockImplementation((url: string) => {
    if (url === 'https://api.curve.fi/v1/getPools/celo/factory') {
      return {
        json: jest.fn().mockResolvedValue(mockResponse),
      }
    }
    throw new Error('Invalid curve url')
  }),
}))

const mockResponse = {
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
        implementationAddress: '0xBcdCADB91446366d10b293152c967e64dE789B92',
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
        implementationAddress: '0xBcdCADB91446366d10b293152c967e64dE789B92',
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
        implementationAddress: '0xfEE7166C32Bdf6356Ef60636f43400AA55551A96',
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
}

describe('curve positions', () => {
  describe('getAllCurvePools', () => {
    it('gives empty list for unknown or unsupported network', async () => {
      const result = await getAllCurvePools('unknown' as NetworkId)
      expect(result).toEqual([])

      const result2 = await getAllCurvePools(NetworkId['ethereum-sepolia'])
      expect(result2).toEqual([])
    })
    it('gives list of pools for celo', async () => {
      const result = await getAllCurvePools(NetworkId['celo-mainnet'])
      expect(result).toEqual([
        {
          address: '0x998395fEd908d33CF27115A1D9Ab6555def6cd45',
          size: 3,
        },
        {
          address: '0x32fD7e563c6521Ab4D59CE3277bcfBe3317CFd63',
          size: 3,
        },
        {
          address: '0xAF7Ee5Ba02dC9879D24cb16597cd854e13f3aDa8',
          size: 2,
        },
      ])
    })
  })
})
