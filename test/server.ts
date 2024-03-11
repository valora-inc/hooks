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
]

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...handlers)
