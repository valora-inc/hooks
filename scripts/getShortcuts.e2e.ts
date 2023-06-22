import * as $ from 'shelljs'

describe('getShortcuts', () => {
  it('should get shortcuts successfully', () => {
    const result = $.exec('yarn getShortcuts')
    expect(result.code).toBe(0)
  })
})
