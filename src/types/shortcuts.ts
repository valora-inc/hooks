import { z, ZodObject, ZodRawShape } from 'zod'
import { NetworkId } from './networkId'

export type ShortcutCategory = 'claim' | 'deposit' | 'withdraw'

export interface ShortcutsHook {
  getShortcutDefinitions(
    networkId: NetworkId,
    address?: string,
  ): Promise<ShortcutDefinition<ShortcutCategory, any>[]>
}

export const tokenAmounts = z
  .array(
    z.object({
      tokenId: z.string(),
      amount: z.string(),
      useMax: z.boolean().optional(),
    }),
  )
  .nonempty()

// enforces the tokens field to be an array of objects with tokenId and amount
// for all deposit and withdraw shortcuts
type TriggerInputShape<Category> = Category extends 'deposit' | 'withdraw'
  ? ZodRawShape & { tokens: typeof tokenAmounts }
  : ZodRawShape

export interface ShortcutDefinition<
  Category extends ShortcutCategory,
  InputShape extends TriggerInputShape<Category>,
> {
  id: string // Example: claim-reward
  name: string // Example: Claim
  description: string // Example: Claim your reward
  networkIds: NetworkId[] // Example: ['celo-mainnet']
  category: Category
  triggerInputShape: InputShape
  onTrigger: (
    args: {
      networkId: NetworkId
      address: string
    } & z.infer<ZodObject<InputShape>>,
  ) => Promise<Transaction[]> // 0, 1 or more transactions to sign by the user
}

export type Transaction = {
  networkId: NetworkId
  from: string
  to: string
  data: string
  // These are needed when returning more than one transaction
  gas?: BigInt // in wei
  estimatedGasUse?: BigInt // in wei
}

// This is to help TS infer the type of the triggerInputShape
// so the onTrigger args can be properly typed
export function createShortcut<
  Category extends ShortcutCategory,
  InputShape extends TriggerInputShape<Category>,
>(definition: ShortcutDefinition<Category, InputShape>) {
  return definition
}
