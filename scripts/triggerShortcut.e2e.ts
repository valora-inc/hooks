import * as $ from 'shelljs'

describe('triggerShortcut', () => {
  it('should trigger a shortcut successfully', () => {
    const result = $.exec(
      'yarn triggerShortcut --network celo --address 0x2b8441ef13333ffa955c9ea5ab5b3692da95260d --app ubeswap --shortcut claim-reward --positionAddress 0x',
    )
    expect(result.code).toBe(0)
  })
})
