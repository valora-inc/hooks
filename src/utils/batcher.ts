const BATCH_SIZE = 100

export function createBatches<Type>(items: Type[]): Type[][] {
  const batches: Type[][] = []
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE))
  }
  return batches
}
