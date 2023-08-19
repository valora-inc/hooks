import hook from './positions'

describe('getPositionDefinitions', () => {
  it('should get the address definitions successfully', async () => {
    const positions = await hook.getPositionDefinitions(
      'celo',
      '0x87cc596554edeff947b6801df16729a173b694fd',
    )
    // Simple check to make sure we got some definitions
    expect(positions.length).toBeGreaterThan(0)
  })
})
