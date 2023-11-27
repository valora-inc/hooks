import * as $ from 'shelljs'

describe('getShortcuts', () => {
  it('should get shortcuts successfully', () => {
    const result = $.exec(
      'yarn getShortcuts --address 0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    )
    expect(result.code).toBe(0)
  })
})
