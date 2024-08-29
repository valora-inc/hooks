import got, { RequestError } from 'got'
import { NetworkId } from '../types/networkId'
import { Transaction } from '../types/shortcuts'
import { getConfig } from '../config'

type SimulatedTransactionResponse = {
  status: 'OK'
  simulatedTransactions: {
    status: 'success' | 'failure'
    blockNumber: string
    gasNeeded: number
    gasUsed: number
    gasPrice: string
  }[]
}

export class UnsupportedSimulateRequest extends Error {
  constructor(json: any) {
    super(JSON.stringify(json))
  }
}

export async function simulateTransactions({
  transactions,
  networkId,
}: {
  transactions: Transaction[]
  networkId: NetworkId
}) {
  const url = getConfig().SIMULATE_TRANSACTIONS_URL
  if (!url) {
    throw new Error('No SIMULATE_TRANSACTIONS_URL value set')
  }

  let response

  try {
    response = await got
      .post(url, {
        json: {
          transactions,
          networkId,
        },
      })
      .json<SimulatedTransactionResponse>()
  } catch (error) {
    if (error instanceof RequestError) {
      const requestError = error as RequestError
      // Assume all 400s are basically "valid, but unsupported request" (e.g.,
      // networkId isn't supported) vs "invalid request because the simulate
      // transaction integration is broken".
      if (requestError?.response?.statusCode === 400) {
        throw new UnsupportedSimulateRequest(requestError.options.json)
      }
    }
    throw error
  }

  if (response.status !== 'OK') {
    throw new Error(
      `Unexpected simulateTransactions status: ${JSON.stringify(response)}`,
    )
  }

  const { simulatedTransactions } = response

  if (simulatedTransactions.length !== transactions.length) {
    throw new Error(
      `Expected ${transactions.length} simulated transactions, got ${
        simulatedTransactions.length
      }, response: ${JSON.stringify(simulatedTransactions)}`,
    )
  }

  simulatedTransactions.forEach((tx, i) => {
    if (tx.status !== 'success') {
      throw new Error(
        `Failed to simulate transaction for base transaction ${JSON.stringify(
          transactions[i],
        )}. response: ${JSON.stringify(tx)}`,
      )
    }
  })

  return simulatedTransactions
}
