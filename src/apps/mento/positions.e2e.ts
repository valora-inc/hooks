import hook from './positions'
import { NetworkId } from '../../types/networkId'
import { DisplayProps } from '../../types/positions'

describe('getPositionDefinitions', () => {
  it('should return the airdrop position', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['celo-mainnet'],
      // First address in the CSV list, hopefully won't be claimed or we won't get a position
      '0xb98ed7262e8167aac4909c03b06c66d001353564',
    )
    expect(positions.length).toBeGreaterThan(0)
    const airdropPosition = positions.find(
      (p) => (p.displayProps as DisplayProps).title === 'MENTO Airdrop',
    )
    expect(airdropPosition).toBeDefined()
  })

  it('should return the veMENTO position', async () => {
    const positions = await hook.getPositionDefinitions(
      NetworkId['celo-mainnet'],
      // First address which claimed the airdrop, hopefully will keep the veMENTO position
      '0x7a6f024e8d4a015afd417ddcacedcb98c3976224',
    )
    expect(positions.length).toBeGreaterThan(0)
    const veMentoPosition = positions.find(
      (p) => (p.displayProps as DisplayProps).title === 'veMENTO',
    )
    expect(veMentoPosition).toBeDefined()
  })
})
