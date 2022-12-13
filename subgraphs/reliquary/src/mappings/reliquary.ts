import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import {
  LevelChanged,
  Reliquary as ReliquaryContract,
} from "../../generated/Reliquary/Reliquary";
import { Transfer } from "../../generated/Reliquary/ERC721";
import {
  Deposit,
  EmergencyWithdraw,
  Harvest,
  LogPoolAddition,
  LogPoolModified,
  LogSetEmissionCurve,
  Merge,
  Shift,
  Split,
  Withdraw,
} from "../../generated/Reliquary/Reliquary";
import {
  createHarvest,
  createPool,
  createRelic,
  getOrCreateDailyPoolSnapshot,
  getOrCreateDailyRelicSnapshot,
  getOrCreateEmissionCurve,
  getOrCreateReliquary,
  getOrCreateRewarder,
  getOrCreateUser,
  getPoolLevelOrThrow,
  getPoolOrThrow,
  getRelicOrThrow,
} from "../entities";
import { scaleDown } from "../utils/numbers";
import { EmissionUpdate } from "../../generated/Reliquary/BeetsConstantEmissionCurve";
import { Relic } from "../../generated/schema";

export function logPoolAddition(event: LogPoolAddition): void {
  const params = event.params;
  createPool(
    params.pid.toI32(),
    params.allocPoint.toI32(),
    params.poolToken,
    params.rewarder,
    params.nftDescriptor
  );
}

export function logPoolModified(event: LogPoolModified): void {
  const params = event.params;
  const pool = getPoolOrThrow(params.pid.toI32());
  if (params.rewarder == Address.zero()) {
    pool.rewarder = null;
  } else {
    const rewarder = getOrCreateRewarder(
      params.pid.toI32(),
      Address.fromBytes(params.rewarder)
    );
    pool.rewarder = rewarder.id;
  }
  pool.allocPoint = params.allocPoint.toI32();
  pool.nftDescriptor = params.nftDescriptor;

  pool.save();
}

export function setEmissionCurve(event: LogSetEmissionCurve): void {
  const reliquary = getOrCreateReliquary();
  const emissionCurve = getOrCreateEmissionCurve(
    event.params.emissionCurveAddress
  );
  reliquary.emissionCurve = emissionCurve.id;
  reliquary.save();
}

export function deposit(event: Deposit): void {
  const params = event.params;

  const pool = getPoolOrThrow(params.pid.toI32());
  const relic = getRelicOrThrow(params.relicId.toI32());
  const dailyPoolSnapshot = getOrCreateDailyPoolSnapshot(
    relic.pid,
    event.block.timestamp.toI32()
  );

  const dailyRelicSnapshot = getOrCreateDailyRelicSnapshot(
    relic.id,
    relic.userAddress,
    event.block.timestamp.toI32()
  );

  const scaledAmount = scaleDown(params.amount, 18);

  pool.totalBalance = pool.totalBalance.plus(scaledAmount);
  pool.save();

  const reliquaryContract = ReliquaryContract.bind(dataSource.address());
  const positionInfo = reliquaryContract.getPositionForId(params.relicId);

  relic.entryTimestamp = positionInfo.entry.toI32();
  relic.balance = relic.balance.plus(scaledAmount);
  relic.save();

  dailyRelicSnapshot.balance = relic.balance;
  dailyRelicSnapshot.entryTimestamp = relic.entryTimestamp;
  dailyRelicSnapshot.save();

  const poolLevel = getPoolLevelOrThrow(relic.pid, relic.level);
  poolLevel.balance = poolLevel.balance.plus(scaledAmount);
  poolLevel.save();

  dailyPoolSnapshot.totalBalance = pool.totalBalance;

  dailyPoolSnapshot.dailyDeposited =
    dailyPoolSnapshot.dailyDeposited.plus(scaledAmount);
  dailyPoolSnapshot.save();
}

export function withdraw(event: Withdraw): void {
  const params = event.params;

  const pool = getPoolOrThrow(params.pid.toI32());
  const relic = getRelicOrThrow(params.relicId.toI32());
  const dailyPoolSnapshot = getOrCreateDailyPoolSnapshot(
    relic.pid,
    event.block.timestamp.toI32()
  );
  const dailyRelicSnapshot = getOrCreateDailyRelicSnapshot(
    relic.id,
    relic.userAddress,
    event.block.timestamp.toI32()
  );

  const scaledAmount = scaleDown(params.amount, 18);

  pool.totalBalance = pool.totalBalance.minus(scaledAmount);
  pool.save();

  relic.balance = relic.balance.minus(scaledAmount);
  relic.save();

  dailyRelicSnapshot.balance = relic.balance;
  dailyRelicSnapshot.save();

  const poolLevel = getPoolLevelOrThrow(relic.pid, relic.level);
  poolLevel.balance = poolLevel.balance.minus(scaledAmount);
  poolLevel.save();

  dailyPoolSnapshot.totalBalance = pool.totalBalance;
  dailyPoolSnapshot.dailyWithdrawn =
    dailyPoolSnapshot.dailyWithdrawn.plus(scaledAmount);
  dailyPoolSnapshot.save();
}

export function levelChanged(event: LevelChanged): void {
  const params = event.params;

  const relic = Relic.load(Bytes.fromI32(params.relicId.toI32()));
  if (relic === null) {
    log.warning(`Relic with id %s not found`, [params.relicId.toString()]);
    return;
  }
  const dailyRelicSnapshot = getOrCreateDailyRelicSnapshot(
    relic.id,
    relic.userAddress,
    event.block.timestamp.toI32()
  );

  const previousBalance = getPoolLevelOrThrow(relic.pid, relic.level);

  previousBalance.balance = previousBalance.balance.minus(relic.balance);
  previousBalance.save();

  const nextBalance = getPoolLevelOrThrow(relic.pid, params.newLevel.toI32());
  nextBalance.balance = nextBalance.balance.plus(relic.balance);
  nextBalance.save();

  relic.poolLevel = nextBalance.id;
  relic.level = params.newLevel.toI32();
  relic.save();

  dailyRelicSnapshot.level = relic.level;
  dailyRelicSnapshot.save();
}

export function emergencyWithdraw(event: EmergencyWithdraw): void {
  const params = event.params;

  const pool = getPoolOrThrow(params.pid.toI32());
  const relic = getRelicOrThrow(params.relicId.toI32());
  const dailyPoolSnapshot = getOrCreateDailyPoolSnapshot(
    relic.pid,
    event.block.timestamp.toI32()
  );
  const dailyRelicSnapshot = getOrCreateDailyRelicSnapshot(
    relic.id,
    relic.userAddress,
    event.block.timestamp.toI32()
  );
  const scaledAmount = scaleDown(params.amount, 18);
  pool.totalBalance = pool.totalBalance.minus(scaledAmount);
  pool.save();
  relic.balance = BigDecimal.zero();
  relic.save();

  dailyRelicSnapshot.balance = relic.balance;
  dailyRelicSnapshot.save();

  const poolLevel = getPoolLevelOrThrow(relic.pid, relic.level);
  poolLevel.balance = poolLevel.balance.minus(scaledAmount);
  poolLevel.save();

  dailyPoolSnapshot.totalBalance = pool.totalBalance;
  dailyPoolSnapshot.dailyWithdrawn =
    dailyPoolSnapshot.dailyWithdrawn.plus(scaledAmount);
  dailyPoolSnapshot.save();
}

export function harvest(event: Harvest): void {
  const params = event.params;
  if (params.amount.gt(BigInt.zero())) {
    createHarvest(
      params.relicId.toI32(),
      params.amount,
      event.block.timestamp.toI32(),
      params.to
    );
  }
}

export function split(event: Split): void {
  const params = event.params;
  const relicFrom = getRelicOrThrow(params.fromId.toI32());
  const dailyRelicFromSnapshot = getOrCreateDailyRelicSnapshot(
    relicFrom.id,
    relicFrom.userAddress,
    event.block.timestamp.toI32()
  );
  const relicTo = getRelicOrThrow(params.toId.toI32());
  const dailyRelicToSnapshot = getOrCreateDailyRelicSnapshot(
    relicTo.id,
    relicTo.userAddress,
    event.block.timestamp.toI32()
  );

  const scaledAmount = scaleDown(params.amount, 18);

  relicFrom.balance = relicFrom.balance.minus(scaledAmount);
  relicFrom.save();

  dailyRelicFromSnapshot.balance = relicFrom.balance;
  dailyRelicFromSnapshot.save();

  relicTo.balance = scaledAmount;
  relicTo.entryTimestamp = relicFrom.entryTimestamp;
  relicTo.level = relicFrom.level;
  relicTo.poolLevel = relicFrom.poolLevel;
  relicTo.save();

  dailyRelicToSnapshot.balance = relicTo.balance;
  dailyRelicToSnapshot.entryTimestamp = relicTo.entryTimestamp;
  dailyRelicToSnapshot.level = relicTo.level;
  dailyRelicFromSnapshot.save();
}

export function shift(event: Shift): void {
  const params = event.params;

  const relicFrom = getRelicOrThrow(params.fromId.toI32());
  const dailyRelicFromSnapshot = getOrCreateDailyRelicSnapshot(
    relicFrom.id,
    relicFrom.userAddress,
    event.block.timestamp.toI32()
  );
  const relicTo = getRelicOrThrow(params.toId.toI32());
  const dailyRelicToSnapshot = getOrCreateDailyRelicSnapshot(
    relicTo.id,
    relicTo.userAddress,
    event.block.timestamp.toI32()
  );

  const scaledAmount = scaleDown(params.amount, 18);

  const reliquaryContract = ReliquaryContract.bind(dataSource.address());
  const positionInfoRelicTo = reliquaryContract.getPositionForId(params.toId);

  relicFrom.balance = relicFrom.balance.minus(scaledAmount);
  relicFrom.save();

  dailyRelicFromSnapshot.balance = relicFrom.balance;
  dailyRelicFromSnapshot.save();

  const fromLevelBalance = getPoolLevelOrThrow(relicFrom.pid, relicFrom.level);
  fromLevelBalance.balance = fromLevelBalance.balance.minus(scaledAmount);
  fromLevelBalance.save();

  relicTo.balance = relicTo.balance.plus(scaledAmount);
  relicTo.entryTimestamp = positionInfoRelicTo.entry.toI32();
  relicTo.save();

  dailyRelicToSnapshot.balance = relicTo.balance;
  dailyRelicToSnapshot.entryTimestamp = relicTo.entryTimestamp;
  dailyRelicToSnapshot.save();

  const toLevelBalance = getPoolLevelOrThrow(relicTo.pid, relicTo.level);
  toLevelBalance.balance = toLevelBalance.balance.plus(scaledAmount);
  toLevelBalance.save();
}

export function merge(event: Merge): void {
  const params = event.params;

  const relicFrom = getRelicOrThrow(params.fromId.toI32());
  const dailyRelicFromSnapshot = getOrCreateDailyRelicSnapshot(
    relicFrom.id,
    relicFrom.userAddress,
    event.block.timestamp.toI32()
  );
  const relicTo = getRelicOrThrow(params.toId.toI32());
  const dailyRelicToSnapshot = getOrCreateDailyRelicSnapshot(
    relicTo.id,
    relicTo.userAddress,
    event.block.timestamp.toI32()
  );

  const scaledAmount = scaleDown(params.amount, 18);

  const reliquaryContract = ReliquaryContract.bind(dataSource.address());
  const positionInfoRelicTo = reliquaryContract.getPositionForId(params.toId);

  relicFrom.balance = BigDecimal.zero();
  relicFrom.save();

  dailyRelicFromSnapshot.balance = relicFrom.balance;
  dailyRelicFromSnapshot.save();

  const fromLevelBalance = getPoolLevelOrThrow(relicFrom.pid, relicFrom.level);
  fromLevelBalance.balance = fromLevelBalance.balance.minus(scaledAmount);
  fromLevelBalance.save();

  relicTo.balance = relicTo.balance.plus(scaledAmount);
  relicTo.entryTimestamp = positionInfoRelicTo.entry.toI32();
  relicTo.save();

  dailyRelicToSnapshot.balance = relicTo.balance;
  dailyRelicToSnapshot.entryTimestamp = relicTo.entryTimestamp;
  dailyRelicToSnapshot.save();

  const toLevelBalance = getPoolLevelOrThrow(relicTo.pid, relicTo.level);
  toLevelBalance.balance = toLevelBalance.balance.plus(scaledAmount);
  toLevelBalance.save();
}

export function transfer(event: Transfer): void {
  if (event.params.from == Address.zero()) {
    // mint
    const relic = createRelic(event.params.to, event.params.tokenId.toI32());
    const reliquary = getOrCreateReliquary();
    reliquary.relicCount++;
    reliquary.save();

    const pool = getPoolOrThrow(relic.pid);
    pool.relicCount++;
    pool.save();
    const dailyPoolSnapshot = getOrCreateDailyPoolSnapshot(
      relic.pid,
      event.block.timestamp.toI32()
    );
    dailyPoolSnapshot.relicCount = pool.relicCount;
    dailyPoolSnapshot.save();
  } else if (event.params.to == Address.zero()) {
    // burn
    const relic = getRelicOrThrow(event.params.tokenId.toI32());
    const reliquary = getOrCreateReliquary();
    reliquary.relicCount--;
    reliquary.save();
    relic.user = getOrCreateUser(Address.zero()).address;
    relic.save();

    const pool = getPoolOrThrow(relic.pid);
    pool.relicCount--;
    pool.save();
    const snapshot = getOrCreateDailyPoolSnapshot(
      relic.pid,
      event.block.timestamp.toI32()
    );
    snapshot.relicCount = pool.relicCount;
    snapshot.save();
  } else {
    // account transfer
    const relic = getRelicOrThrow(event.params.tokenId.toI32());
    const dailyRelicSnapshot = getOrCreateDailyRelicSnapshot(
      relic.id,
      relic.userAddress,
      event.block.timestamp.toI32()
    );
    const userTo = getOrCreateUser(Address.fromBytes(relic.user));
    relic.user = userTo.id;
    relic.save();

    dailyRelicSnapshot.user = userTo.id;
    dailyRelicSnapshot.userAddress = userTo.address;
    dailyRelicSnapshot.save();
  }
}

export function emissionUpdate(event: EmissionUpdate): void {
  const emissionCurve = getOrCreateEmissionCurve(dataSource.address());
  emissionCurve.rewardPerSecond = scaleDown(event.params.rewardsPerSecond, 18);
  emissionCurve.save();
}
