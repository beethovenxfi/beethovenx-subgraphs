import {
  assert,
  clearStore,
  newMockEvent,
  test,
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { getUser } from "../src/entities/user";
import { getLocker } from "../src/entities/locker";
import { getLockingPeriod } from "../src/entities/locking-period";
import { getClaimedReward } from "../src/entities/claimed-reward";
import { getRewardToken } from "../src/entities/reward-token";
import {
  kickReward,
  locked,
  rewardAdded,
  rewardPaid,
  setKickIncentive,
  withdrawn,
} from "../src/mappings/fbeetslocker";
import {
  KickReward,
  Locked,
  RewardAdded,
  RewardPaid,
  SetKickIncentive,
  Withdrawn,
} from "../generated/Locker/FBeetsLocker";
import { BIG_DECIMAL_1E18 } from "../src/constants";
import { mockERC20Contract, mockLockerContract } from "./mocks";

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
    lockerAddress,
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
  assert.fieldEquals("Locker", lockerAddress.toHex(), "totalLockedAmount", "0");
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
  assert.fieldEquals(
    "User",
    userAddress.toHex(),
    "block",
    event.block.number.toString()
  );
  assert.fieldEquals(
    "User",
    userAddress.toHex(),
    "timestamp",
    event.block.timestamp.toString()
  );

  clearStore();
});

test("initializes locking period correctly", () => {
  const userAddress = Address.fromString(
    "0x0000000000000000000000000000000000001234"
  );
  const event = newMockEvent();
  const epoch = BigInt.fromString("1645776173");
  getLockingPeriod(userAddress, epoch, event.block);

  const lockingPeriodId = `${userAddress.toHex()}-${epoch.toHex()}`;
  assert.fieldEquals(
    "LockingPeriod",
    lockingPeriodId,
    "epoch",
    epoch.toString()
  );

  assert.fieldEquals(
    "LockingPeriod",
    lockingPeriodId,
    "user",
    userAddress.toHex()
  );

  assert.fieldEquals("LockingPeriod", lockingPeriodId, "lockAmount", "0");

  assert.fieldEquals(
    "LockingPeriod",
    lockingPeriodId,
    "block",
    event.block.number.toString()
  );
  assert.fieldEquals(
    "LockingPeriod",
    lockingPeriodId,
    "timestamp",
    event.block.number.toString()
  );
  clearStore();
});

test("initializes claimed reward correctly", () => {
  const userAddress = Address.fromString(
    "0x0000000000000000000000000000000000001234"
  );
  const rewardTokenAddress = Address.fromString(
    "0x0000000000000000000000000000000000001111"
  );
  const event = newMockEvent();
  getClaimedReward(userAddress, rewardTokenAddress, event.block);

  const claimedUserRewardId = `${userAddress.toHex()}-${rewardTokenAddress.toHex()}`;

  assert.fieldEquals(
    "ClaimedReward",
    claimedUserRewardId,
    "token",
    rewardTokenAddress.toHex()
  );

  assert.fieldEquals("ClaimedReward", claimedUserRewardId, "amount", "0");

  assert.fieldEquals(
    "ClaimedReward",
    claimedUserRewardId,
    "block",
    event.block.number.toString()
  );
  assert.fieldEquals(
    "ClaimedReward",
    claimedUserRewardId,
    "timestamp",
    event.block.number.toString()
  );
  clearStore();
});

test("initializes reward token correctly", () => {
  const rewardTokenAddress = Address.fromString(
    "0x0000000000000000000000000000000000001111"
  );

  const decimals = "10";
  mockERC20Contract(rewardTokenAddress, "RewardToken", "RT", decimals);
  const event = newMockEvent();
  getRewardToken(rewardTokenAddress, event.block);

  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "rewardToken",
    rewardTokenAddress.toHex()
  );
  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "decimals",
    decimals
  );
  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "totalRewardAmount",
    "0"
  );
  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "rewardRate",
    "0"
  );
  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "rewardPeriodFinish",
    "0"
  );
  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "block",
    event.block.number.toString()
  );
  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "timestamp",
    event.block.number.toString()
  );
  clearStore();
});

test("accredits newly locked tokens", () => {
  /*
      adds newly locked amount to global locked amount, locked amount of user and also adds it
      to the locking period defined by the epoch
   */

  const userAddress = Address.fromString(
    "0x0000000000000000000000000000000000001234"
  );
  mockLockerContract(lockerAddress);
  const lockedAmount: i32 = 10_000;
  const epoch: i32 = 1645805322;
  const event = aLockedEvent(userAddress, lockedAmount, epoch);
  locked(event);

  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "totalLockedAmount",
    BigInt.fromI32(lockedAmount).divDecimal(BIG_DECIMAL_1E18).toString()
  );

  assert.fieldEquals(
    "User",
    userAddress.toHex(),
    "totalLockedAmount",
    BigInt.fromI32(lockedAmount).divDecimal(BIG_DECIMAL_1E18).toString()
  );

  const lockingPeriodId = `${userAddress.toHex()}-${BigInt.fromI32(
    epoch
  ).toHex()}`;

  assert.fieldEquals(
    "LockingPeriod",
    lockingPeriodId,
    "lockAmount",

    BigInt.fromI32(lockedAmount).divDecimal(BIG_DECIMAL_1E18).toString()
  );

  // we add another lock in the same epoch

  const anotherLockedAmount: i32 = 10_000;
  const anotherEventInSameEpoch = aLockedEvent(
    userAddress,
    anotherLockedAmount,
    epoch
  );
  locked(anotherEventInSameEpoch);

  const totalAmountAfterSecondLock = lockedAmount + anotherLockedAmount;
  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "totalLockedAmount",
    BigInt.fromI32(totalAmountAfterSecondLock)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );

  assert.fieldEquals(
    "User",
    userAddress.toHex(),
    "totalLockedAmount",
    BigInt.fromI32(totalAmountAfterSecondLock)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );

  assert.fieldEquals(
    "LockingPeriod",
    lockingPeriodId,
    "lockAmount",

    BigInt.fromI32(totalAmountAfterSecondLock)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );

  // now we add another event in another epoch

  const yetAnotherLockedAmount: i32 = 19_000;
  const anotherEpoch: i32 = 1645805422;
  const yetAnotherEvent = aLockedEvent(
    userAddress,
    yetAnotherLockedAmount,
    anotherEpoch
  );
  locked(yetAnotherEvent);

  const totalAmountAfterThirdLock =
    totalAmountAfterSecondLock + yetAnotherLockedAmount;
  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "totalLockedAmount",
    BigInt.fromI32(totalAmountAfterThirdLock)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );

  assert.fieldEquals(
    "User",
    userAddress.toHex(),
    "totalLockedAmount",
    BigInt.fromI32(totalAmountAfterThirdLock)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );

  const anotherLockingPeriodId = `${userAddress.toHex()}-${BigInt.fromI32(
    anotherEpoch
  ).toHex()}`;

  assert.fieldEquals(
    "LockingPeriod",
    anotherLockingPeriodId,
    "lockAmount",

    BigInt.fromI32(yetAnotherLockedAmount)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );

  // finally we add a lock from a different user
  const anotherUserAddress = Address.fromString(
    "0x0000000000000000000000000000000000009055"
  );
  const otherUserLockEvent = aLockedEvent(
    anotherUserAddress,
    yetAnotherLockedAmount,
    anotherEpoch
  );
  locked(otherUserLockEvent);

  const totalAmountAfterFourthLock =
    totalAmountAfterThirdLock + yetAnotherLockedAmount;
  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "totalLockedAmount",
    BigInt.fromI32(totalAmountAfterFourthLock)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );

  assert.fieldEquals(
    "User",
    anotherUserAddress.toHex(),
    "totalLockedAmount",
    BigInt.fromI32(yetAnotherLockedAmount)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );

  const anotherUserLockingPeriodId = `${anotherUserAddress.toHex()}-${BigInt.fromI32(
    anotherEpoch
  ).toHex()}`;

  assert.fieldEquals(
    "LockingPeriod",
    anotherUserLockingPeriodId,
    "lockAmount",

    BigInt.fromI32(yetAnotherLockedAmount)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );
  clearStore();
});

test("removes withdrawn tokens", () => {
  /*
      removes withdrawn amount from total and user amount
   */

  const userAddress = Address.fromString(
    "0x0000000000000000000000000000000000001234"
  );
  mockLockerContract(lockerAddress);
  const lockedAmount: i32 = 10_000;
  const epoch: i32 = 1645805322;
  const event = aLockedEvent(userAddress, lockedAmount, epoch);
  locked(event);

  const withdrawAmount: i32 = 5_000;
  const withdrawEvent = aWithdrawEvent(userAddress, withdrawAmount, false);
  withdrawn(withdrawEvent);

  const expectedLockedAmount = BigInt.fromI32(lockedAmount - withdrawAmount)
    .divDecimal(BIG_DECIMAL_1E18)
    .toString();

  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "totalLockedAmount",
    expectedLockedAmount
  );

  assert.fieldEquals(
    "User",
    userAddress.toHex(),
    "totalLockedAmount",
    expectedLockedAmount
  );

  const lockingPeriodId = `${userAddress.toHex()}-${BigInt.fromI32(
    epoch
  ).toHex()}`;

  assert.fieldEquals(
    "LockingPeriod",
    lockingPeriodId,
    "lockAmount",

    BigInt.fromI32(lockedAmount).divDecimal(BIG_DECIMAL_1E18).toString()
  );

  clearStore();
});

test("adjusts total reward amount, reward rate and reward finish period for a reward token", () => {
  mockLockerContract(lockerAddress);
  const rewardTokenAddress = Address.fromString(
    "0x0000000000000000000000000000000000009999"
  );
  mockERC20Contract(rewardTokenAddress);

  const rewardAmount: i32 = 10_000;
  const rewardRate: i32 = 10;
  const periodFinish: i32 = 1646489445;
  const rewardEvent = aRewardAddedEvent(
    rewardTokenAddress,
    rewardAmount,
    rewardRate,
    periodFinish
  );
  rewardAdded(rewardEvent);

  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "totalRewardAmount",
    BigInt.fromI32(rewardAmount).divDecimal(BIG_DECIMAL_1E18).toString()
  );
  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "rewardRate",
    BigInt.fromI32(rewardRate).divDecimal(BIG_DECIMAL_1E18).toString()
  );
  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "rewardPeriodFinish",
    BigInt.fromI32(periodFinish).toString()
  );

  // we add another reward

  const anotherRewardAmount: i32 = 20_000;
  const anotherRewardRate: i32 = 15;
  const anotherPeriodFinish: i32 = 1646489559;

  const anotherRewardEvent = aRewardAddedEvent(
    rewardTokenAddress,
    anotherRewardAmount,
    anotherRewardRate,
    anotherPeriodFinish
  );
  rewardAdded(anotherRewardEvent);

  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "totalRewardAmount",
    BigInt.fromI32(rewardAmount + anotherRewardAmount)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );
  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "rewardRate",
    BigInt.fromI32(anotherRewardRate).divDecimal(BIG_DECIMAL_1E18).toString()
  );
  assert.fieldEquals(
    "RewardToken",
    rewardTokenAddress.toHex(),
    "rewardPeriodFinish",
    BigInt.fromI32(anotherPeriodFinish).toString()
  );
  clearStore();
});

test("adds claimed rewards to user", () => {
  mockLockerContract(lockerAddress);
  const rewardTokenAddress = Address.fromString(
    "0x0000000000000000000000000000000000009999"
  );
  mockERC20Contract(rewardTokenAddress);

  const userAddress = Address.fromString(
    "0x0000000000000000000000000000000000001234"
  );

  const reward: i32 = 5000;
  const event = aRewardPaidEvent(userAddress, rewardTokenAddress, reward);
  rewardPaid(event);
  const claimedRewardId = `${userAddress.toHex()}-${rewardTokenAddress.toHex()}`;

  assert.fieldEquals(
    "ClaimedReward",
    claimedRewardId,
    "amount",
    BigInt.fromI32(reward).divDecimal(BIG_DECIMAL_1E18).toString()
  );

  // user claims some more rewards

  const anotherReward: i32 = 3000;
  const anotherEvent = aRewardPaidEvent(
    userAddress,
    rewardTokenAddress,
    anotherReward
  );
  rewardPaid(anotherEvent);

  assert.fieldEquals(
    "ClaimedReward",
    claimedRewardId,
    "amount",
    BigInt.fromI32(reward + anotherReward)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );
  clearStore();
});

test("updates kick incentive rules", () => {
  mockLockerContract(lockerAddress);
  const kickRewardEpochDelay = 7200;
  const kickRewardPerEpoch = 500;
  const event = aSetKickIncentivesEvent(
    kickRewardEpochDelay,
    kickRewardPerEpoch
  );

  setKickIncentive(event);

  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "kickRewardEpochDelay",
    BigInt.fromI32(kickRewardEpochDelay).toString()
  );
  assert.fieldEquals(
    "Locker",
    lockerAddress.toHex(),
    "kickRewardPerEpoch",
    BigInt.fromI32(kickRewardPerEpoch).toString()
  );
  clearStore();
});

test("adds kick reward for user", () => {
  const userAddress = Address.fromString(
    "0x0000000000000000000000000000000000001234"
  );
  const kickedUserAddress = Address.fromString(
    "0x0000000000000000000000000000000000005544"
  );
  const reward = 500;
  mockLockerContract(lockerAddress);
  const event = aKickRewardEvent(userAddress, kickedUserAddress, reward);

  kickReward(event);
  assert.fieldEquals(
    "User",
    userAddress.toHex(),
    "collectedKickRewardAmount",
    BigInt.fromI32(reward).divDecimal(BIG_DECIMAL_1E18).toString()
  );
  assert.fieldEquals(
    "User",
    kickedUserAddress.toHex(),
    "totalLostThroughKick",
    BigInt.fromI32(reward).divDecimal(BIG_DECIMAL_1E18).toString()
  );
  // we add another kick reward

  const anotherReward = 800;
  mockLockerContract(lockerAddress);
  const anotherEvent = aKickRewardEvent(
    userAddress,
    kickedUserAddress,
    anotherReward
  );

  kickReward(anotherEvent);
  assert.fieldEquals(
    "User",
    userAddress.toHex(),
    "collectedKickRewardAmount",
    BigInt.fromI32(reward + anotherReward)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );
  assert.fieldEquals(
    "User",
    kickedUserAddress.toHex(),
    "totalLostThroughKick",
    BigInt.fromI32(reward + anotherReward)
      .divDecimal(BIG_DECIMAL_1E18)
      .toString()
  );
  clearStore();
});

function aLockedEvent(
  userAddress: Address,
  lockedAmount: i32,
  epoch: i32
): Locked {
  const event = newMockEvent();
  event.parameters.push(
    new ethereum.EventParam("_user", ethereum.Value.fromAddress(userAddress))
  );
  event.parameters.push(
    new ethereum.EventParam(
      "_lockedAmount",
      ethereum.Value.fromI32(lockedAmount)
    )
  );
  event.parameters.push(
    new ethereum.EventParam("_epoch", ethereum.Value.fromI32(epoch))
  );
  return new Locked(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    event.parameters
  );
}

function aWithdrawEvent(
  userAddress: Address,
  lockedAmount: i32,
  relocked: boolean
): Withdrawn {
  const event = newMockEvent();
  event.parameters.push(
    new ethereum.EventParam("_user", ethereum.Value.fromAddress(userAddress))
  );
  event.parameters.push(
    new ethereum.EventParam("_amount", ethereum.Value.fromI32(lockedAmount))
  );
  event.parameters.push(
    new ethereum.EventParam("_relocked", ethereum.Value.fromBoolean(relocked))
  );
  return new Withdrawn(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    event.parameters
  );
}

function aRewardAddedEvent(
  token: Address,
  reward: i32,
  rewardRate: i32,
  periodFinish: i32
): RewardAdded {
  const event = newMockEvent();
  event.parameters.push(
    new ethereum.EventParam("_token", ethereum.Value.fromAddress(token))
  );
  event.parameters.push(
    new ethereum.EventParam("_reward", ethereum.Value.fromI32(reward))
  );
  event.parameters.push(
    new ethereum.EventParam("_rewardRate", ethereum.Value.fromI32(rewardRate))
  );
  event.parameters.push(
    new ethereum.EventParam(
      "_periodFinish",
      ethereum.Value.fromI32(periodFinish)
    )
  );
  return new RewardAdded(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    event.parameters
  );
}

function aRewardPaidEvent(
  user: Address,
  token: Address,
  reward: i32
): RewardPaid {
  const event = newMockEvent();
  event.parameters.push(
    new ethereum.EventParam("_user", ethereum.Value.fromAddress(user))
  );
  event.parameters.push(
    new ethereum.EventParam("_rewardsToken", ethereum.Value.fromAddress(token))
  );
  event.parameters.push(
    new ethereum.EventParam("_reward", ethereum.Value.fromI32(reward))
  );
  return new RewardPaid(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    event.parameters
  );
}

function aSetKickIncentivesEvent(
  kickRewardEpochDelay: i32,
  kickRewardPerEpoch: i32
): SetKickIncentive {
  const event = newMockEvent();
  event.parameters.push(
    new ethereum.EventParam(
      "_kickRewardEpochDelay",
      ethereum.Value.fromI32(kickRewardEpochDelay)
    )
  );
  event.parameters.push(
    new ethereum.EventParam(
      "_kickRewardPerEpoch",
      ethereum.Value.fromI32(kickRewardPerEpoch)
    )
  );
  return new SetKickIncentive(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    event.parameters
  );
}
function aKickRewardEvent(
  userAddress: Address,
  kickedUserAddress: Address,
  reward: i32
): KickReward {
  const event = newMockEvent();
  event.parameters.push(
    new ethereum.EventParam("_user", ethereum.Value.fromAddress(userAddress))
  );
  event.parameters.push(
    new ethereum.EventParam(
      "_kicked",
      ethereum.Value.fromAddress(kickedUserAddress)
    )
  );
  event.parameters.push(
    new ethereum.EventParam("_reward", ethereum.Value.fromI32(reward))
  );
  return new KickReward(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    event.parameters
  );
}
