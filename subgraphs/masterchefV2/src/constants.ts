import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000')

export const BIG_DECIMAL_ZERO = BigDecimal.fromString('0')

export const BIG_INT_ONE = BigInt.fromI32(1)

export const BIG_INT_ZERO = BigInt.fromI32(0)

export const ACC_BEETX_PRECISION = BigInt.fromString('1000000000000')

export const MASTER_CHEF_INITIAL_BEETS_PER_BLOCK = BigInt.fromString('5050000000000000000')
