import * as $ from 'shelljs'

describe('getShortcuts', () => {
  it('should get shortcuts successfully with --address', () => {
    const result = $.exec(
      'yarn getShortcuts --address 0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    )
    expect(result.code).toBe(0)
  })

  it('should get shortcuts successfully without --address', () => {
    const result = $.exec(
      'yarn getShortcuts',
    )
    expect(result.code).toBe(0)
  })
})
