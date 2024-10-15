import { BigDecimal } from "@graphprotocol/graph-ts";
import { BIG_INT_TEN } from "./constants";

export function BigDecimal_1e(exponent: i32): BigDecimal {
  return BIG_INT_TEN.pow(u8(exponent)).toBigDecimal();
}
