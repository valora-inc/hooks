import * as $ from 'shelljs'

describe('triggerShortcut', () => {
  it('should trigger a shortcut successfully', () => {
    const result = $.exec(
      'yarn triggerShortcut --network celo --address 0x2b8441ef13333ffa955c9ea5ab5b3692da95260d --app ubeswap --shortcut claim-reward --triggerInputShape {"positionAddress": "0xda7f463c27ec862cfbf2369f3f74c364d050d93f"}',
    )
    expect(result.code).toBe(0)
  })
})
