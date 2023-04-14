import BigNumber from 'bignumber.js'

// Branded types for numbers to avoid confusion between different number types serialized as strings

// Decimal number serialized as a string
export type DecimalNumber = string & { __decimalNumberBrand: never }

// Integer number serialized as a string
export type Integer = string & { __integerBrand: never }

export function toInteger(value: bigint): Integer {
  return value.toString() as Integer
}

export function toDecimalNumber(value: BigNumber.Value): DecimalNumber {
  return new BigNumber(value).toString() as DecimalNumber
}

// Convert bigint balances from ERC20 contracts to decimal numbers
export function toBigDecimal(
  value: bigint,
  decimals: number,
): BigNumber.Instance {
  return new BigNumber(value.toString()).div(new BigNumber(10).pow(decimals))
}
