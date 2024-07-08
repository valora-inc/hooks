import { Address as ZodAddress } from 'abitype/zod'
import { Address } from 'viem'

export type { Address } from 'viem'

export const ZodAddressLowerCased = ZodAddress.transform((val) => {
  return val.toLowerCase() as Address
})
