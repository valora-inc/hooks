import { Address, parseEther } from 'viem'
import { toDecimalNumber } from '../../types/numbers'
import { PositionsHook } from '../../types/positions'

const CELO_NATIVE_ADDRESS: Address =
  '0x471ece3750da237f93b8e339c536989b8978a438'
const CUSD_ADDRESS: Address = '0x765de816845861e75a25fca122bb6898b8b1282a'
export const DEFAULT_IMG_URL =
  'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/CELO.png'

const hook: PositionsHook = {
  getInfo() {
    return {
      id: 'example',
      name: 'Example',
      description: 'Example position for developers',
    }
  },

  async getPositionDefinitions(network: string, _address: string) {
    //
    // This example pretend position only exists on Celo.
    //
    if (network !== 'celo') {
      return []
    }

    //
    // If you're going to query a blockchain, you should use viem. E.g.,
    //
    //   const client = createPublicClient({
    //     chain: celo,
    //     transport: http(),
    //   })
    //
    // If you're going to query other state served over HTTPS, you should use got.
    //

    //
    // Some tokens on Celo that compose this example pretend position...
    //
    const tokens = [
      {
        address: CELO_NATIVE_ADDRESS,
        network,
      },
      {
        address: CUSD_ADDRESS,
        network,
      },
    ]

    //
    // ...and associated balances for tokens above. The hooks interface uses a
    // special DecimalNumber type to represent balances.
    //
    const balances = [
      toDecimalNumber(parseEther('1'), 18),
      toDecimalNumber(parseEther('1'), 18),
    ]

    return [
      {
        // Position Hooks type, see https://docs.valora.xyz/hooks/
        type: 'contract-position-definition',
        network,
        // This serves an ID and by convention it should be the contract holding
        // the underlying position. The runtime passed this addresses to any
        // shortcut definitions that might execute on this position.
        address: `0x${'1'.repeat(40)}`,
        tokens,
        balances,
        displayProps: {
          title: 'Example position',
          description: 'See the code!',
          imageUrl: DEFAULT_IMG_URL,
        },
      },
    ]
  },

  async getAppTokenDefinition(_) {
    throw new Error('Not implemented')
  },
}

export default hook
