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

// Convert bigint balances from ERC20 contracts to decimal numbers
export function toDecimalNumber(
  value: bigint,
  decimals: number,
): DecimalNumber {
  return new BigNumber(value.toString()).shiftedBy(-decimals) as DecimalNumber
}
