import got from 'got'
import { NetworkId } from '../types/networkId'
import { Transaction } from '../types/shortcuts'

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

export async function simulateTransactions({
  url,
  transactions,
  networkId,
}: {
  url: string
  transactions: Transaction[]
  networkId: NetworkId
}) {
  const response = await got
    .post(url, {
      json: {
        transactions,
        networkId,
      },
    })
    .json<SimulatedTransactionResponse>()

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
