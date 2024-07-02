import { z, ZodObject, ZodRawShape } from 'zod'
import { NetworkId } from './networkId'

export interface ShortcutsHook {
  getShortcutDefinitions(
    networkId: NetworkId,
    address?: string,
  ): Promise<ShortcutDefinition<any>[]>
}

export interface ShortcutDefinition<TriggerInputShape extends ZodRawShape> {
  id: string // Example: claim-reward
  name: string // Example: Claim
  description: string // Example: Claim your reward
  networkIds: NetworkId[] // Example: ['celo-mainnet']
  category?: 'claim' // We'll add more categories later
  triggerInputShape: TriggerInputShape // Zod object shape of the input for the trigger
  onTrigger: (
    args: {
      networkId: NetworkId
      address: string
    } & z.infer<ZodObject<TriggerInputShape>>,
  ) => Promise<Transaction[]> // 0, 1 or more transactions to sign by the user
}

export type Transaction = {
  networkId: NetworkId
  from: string
  to: string
  data: string
}

// This is to help TS infer the type of the triggerInputShape
// so the onTrigger args can be properly typed
export function createShortcut<TriggerInputShape extends ZodRawShape>(
  definition: ShortcutDefinition<TriggerInputShape>,
) {
  return definition
}
