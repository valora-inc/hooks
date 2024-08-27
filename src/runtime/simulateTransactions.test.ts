import { NetworkId } from '../types/networkId'
import { simulateTransactions } from './simulateTransactions'
import { Transaction } from '../types/shortcuts'
import got from 'got'

jest.mock('got')

describe('simulateTransactions', () => {
  // Doesn't matter what the transactions are
  const mockTransactions = [{}, {}] as Transaction[]

  it('returns successfully', async () => {
    const mockedGot = jest.mocked(got)
    mockedGot.post = jest.fn().mockReturnValue({
      json: () =>
        Promise.resolve({
          status: 'OK',
          simulatedTransactions: mockTransactions.map((_) => ({
            status: 'success',
          })),
        }),
    })

    await expect(
      simulateTransactions({
        url: 'http://foo.com/simulate',
        transactions: mockTransactions,
        networkId: NetworkId['ethereum-mainnet'],
      }),
    ).resolves.not.toThrow()
  })

  it("throws if status isn't OK", async () => {
    const mockedGot = jest.mocked(got)
    mockedGot.post = jest.fn().mockReturnValue({
      json: () =>
        Promise.resolve({
          status: 'not ok',
        }),
    })

    await expect(
      simulateTransactions({
        url: 'http://foo.com/simulate',
        transactions: mockTransactions,
        networkId: NetworkId['ethereum-mainnet'],
      }),
    ).rejects.toThrow()
  })

  it('throws if transaction simulation fails', async () => {
    const mockedGot = jest.mocked(got)
    mockedGot.post = jest.fn().mockReturnValue({
      json: () =>
        Promise.resolve({
          status: 'OK',
          simulatedTransactions: mockTransactions.map((_) => ({
            status: 'failures',
          })),
        }),
    })

    await expect(
      simulateTransactions({
        url: 'http://foo.com/simulate',
        transactions: mockTransactions,
        networkId: NetworkId['ethereum-mainnet'],
      }),
    ).rejects.toThrow()
  })
})
