import BigNumber from 'bignumber.js'

// Branded types for numbers to avoid confusion between different number types serialized as strings
// This means numbers (bigint,number,BigNumber) will need to be explicitly converted to match the needed type declared

// Decimal number serialized as a string
export type SerializedDecimalNumber = string & {
  __serializedDecimalNumberBrand: never
}

// Decimal number stored as a BigNumber
export type DecimalNumber = BigNumber & { __decimalNumberBrand: never }

export function toSerializedDecimalNumber(
  value: BigNumber.Value,
): SerializedDecimalNumber {
  return (
    new BigNumber(value)
      // Use a maximum of 20 decimals, to avoid very long serialized numbers
      .decimalPlaces(20)
      .toString() as SerializedDecimalNumber
  )
}

export function toDecimalNumber(value: BigNumber.Value): DecimalNumber
// Convert bigint balances from ERC20 contracts to decimal numbers
export function toDecimalNumber(value: bigint, decimals: number): DecimalNumber
export function toDecimalNumber(
  ...args: [BigNumber.Value] | [bigint, number]
): DecimalNumber {
  if (args.length === 1) {
    return new BigNumber(args[0]) as DecimalNumber
  }

  const [value, decimals] = args
  return new BigNumber(value.toString()).shiftedBy(-decimals) as DecimalNumber
}
