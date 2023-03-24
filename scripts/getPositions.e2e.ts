import * as $ from 'shelljs'

describe('getPositions', () => {
  it('should get the address positions successfully', () => {
    const result = $.exec(
      'yarn getPositions --address 0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    )
    expect(result.code).toBe(0)
  })
})
