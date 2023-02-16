import { Address, Bytes } from "@graphprotocol/graph-ts/index";

export function bytesAsAddress(bytes: Bytes): Address {
  return changetype<Address>(bytes);
}
