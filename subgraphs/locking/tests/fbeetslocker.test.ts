import {
  clearStore,
  createMockedFunction,
  log,
  newMockEvent,
  test,
  assert,
  dataSourceMock,
} from "matchstick-as/assembly/index";
import { dataSource, ethereum } from "@graphprotocol/graph-ts/index";
import { Address, BigInt, DataSourceContext } from "@graphprotocol/graph-ts";
import { getUser } from "../src/entities/user";
import { getLocker } from "../src/entities/locker";
import { FBeetsLocker } from "../generated/Locker/FBeetsLocker";

const lockerAddress = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

test("initializes locker entity correct", () => {
  const erc20Name = "Locked fBeets Token";
  const erc20Symbol = "lfBeets";
  const erc20Decimals = "18";
  const epochDuration = "86400";
  const lockDuration = (86400 * 7).toString();
  const kickRewardEpochDelay = "4";
  const kickRewardPerEpoch = "100";

  mockLockerContract(
    erc20Name,
    erc20Symbol,
    erc20Decimals,
    epochDuration,
    lockDuration,
    kickRewardEpochDelay,
    kickRewardPerEpoch
  );

  const event = newMockEvent();
  const locker = getLocker(event.block);
  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "address",
    lockerAddress.toHex()
  );
  assert.fieldEquals("Locker", lockerAddress.toHex(), "name", erc20Name);
  assert.fieldEquals("Locker", lockerAddress.toHex(), "symbol", erc20Symbol);
  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "decimals",
    erc20Decimals
  );
  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "epochDuration",
    epochDuration
  );
  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "lockDuration",
    lockDuration
  );
  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "kickRewardEpochDelay",
    kickRewardEpochDelay
  );
  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "kickRewardPerEpoch",
    kickRewardPerEpoch
  );
  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "block",
    event.block.number.toString()
  );

  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "timestamp",
    event.block.timestamp.toString()
  );

  clearStore();
});

test("Initializes user correct", () => {
  const userAddress = Address.fromString(
    "0x0000000000000000000000000000000000001234"
  );
  const event = newMockEvent();
  getUser(userAddress, event.block);

  assert.fieldEquals(
    "User",
    userAddress.toHex(),
    "address",
    userAddress.toHex()
  );
  assert.fieldEquals("User", userAddress.toHex(), "totalLockedAmount", "0");
  assert.fieldEquals(
    "User",
    userAddress.toHex(),
    "collectedKickRewardAmount",
    "0"
  );
  assert.fieldEquals("User", userAddress.toHex(), "totalLostThroughKick", "0");
});

function mockLockerContract(
  erc20Name: string,
  erc20Symbol: string,
  erc20Decimals: string,
  epochDuration: string,
  lockDuration: string,
  kickRewardEpochDelay: string,
  kickRewardPerEpoch: string
): void {
  createMockedFunction(lockerAddress, "name", "name():(string)").returns([
    ethereum.Value.fromString(erc20Name),
  ]);
  createMockedFunction(lockerAddress, "symbol", "symbol():(string)").returns([
    ethereum.Value.fromString(erc20Symbol),
  ]);
  createMockedFunction(lockerAddress, "decimals", "decimals():(uint8)").returns(
    [ethereum.Value.fromUnsignedBigInt(BigInt.fromString(erc20Decimals))]
  );
  createMockedFunction(
    lockerAddress,
    "epochDuration",
    "epochDuration():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(epochDuration)),
  ]);
  createMockedFunction(
    lockerAddress,
    "lockDuration",
    "lockDuration():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(lockDuration)),
  ]);
  createMockedFunction(
    lockerAddress,
    "kickRewardEpochDelay",
    "kickRewardEpochDelay():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(kickRewardEpochDelay)),
  ]);
  createMockedFunction(
    lockerAddress,
    "kickRewardPerEpoch",
    "kickRewardPerEpoch():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(kickRewardPerEpoch)),
  ]);
}
