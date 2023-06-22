import plugin from './plugin'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const positions = await plugin.getPositionDefinitions(
      'celo',
      '0x2f43b69f4ea32be168f19b998aaf5c3d87dbbdd6',
    )
    // Simple check to make sure we got some definitions
    expect(positions.length).toBeGreaterThan(0)
  })
})
