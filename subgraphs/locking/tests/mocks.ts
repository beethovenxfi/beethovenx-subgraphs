import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts/index";
import { createMockedFunction } from "matchstick-as/assembly/index";

export function mockERC20Contract(
  address: Address,
  name: string = "Token",
  symbol: string = "TKN",
  decimals: string = "18"
): void {
  createMockedFunction(address, "name", "name():(string)").returns([
    ethereum.Value.fromString(name),
  ]);
  createMockedFunction(address, "symbol", "symbol():(string)").returns([
    ethereum.Value.fromString(symbol),
  ]);
  createMockedFunction(address, "decimals", "decimals():(uint8)").returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(decimals)),
  ]);
}

export function mockLockerContract(
  address: Address,
  erc20Name: string = "Locked fBeets Token",
  erc20Symbol: string = "lfBeets",
  erc20Decimals: string = "18",
  epochDuration: string = "86400",
  lockDuration: string = (86400 * 7).toString(),
  kickRewardEpochDelay: string = "4",
  kickRewardPerEpoch: string = "100"
): void {
  createMockedFunction(address, "name", "name():(string)").returns([
    ethereum.Value.fromString(erc20Name),
  ]);
  createMockedFunction(address, "symbol", "symbol():(string)").returns([
    ethereum.Value.fromString(erc20Symbol),
  ]);
  createMockedFunction(address, "decimals", "decimals():(uint8)").returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(erc20Decimals)),
  ]);
  createMockedFunction(
    address,
    "epochDuration",
    "epochDuration():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(epochDuration)),
  ]);
  createMockedFunction(
    address,
    "lockDuration",
    "lockDuration():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(lockDuration)),
  ]);
  createMockedFunction(
    address,
    "kickRewardEpochDelay",
    "kickRewardEpochDelay():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(kickRewardEpochDelay)),
  ]);
  createMockedFunction(
    address,
    "kickRewardPerEpoch",
    "kickRewardPerEpoch():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(kickRewardPerEpoch)),
  ]);
}
