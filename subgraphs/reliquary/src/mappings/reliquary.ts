import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
} from "@graphprotocol/graph-ts";
import { Reliquary as ReliquaryContract } from "../../generated/Reliquary/Reliquary";
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
  getOrCreateEmissionCurve,
  getOrCreateReliquary,
  getOrCreateRewarder,
  getOrCreateUser,
  getPoolOrThrow,
  getRelicOrThrow,
} from "../entities";
import { scaleDown } from "../utils/numbers";
import { EmissionUpdate } from "../../generated/EmissionCurve/BeetsConstantEmissionCurve";

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
  const snapshot = getOrCreateDailyPoolSnapshot(
    relic.pid,
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

  snapshot.totalDeposited = snapshot.totalDeposited.plus(scaledAmount);
  snapshot.save();
}

export function withdraw(event: Withdraw): void {
  const params = event.params;

  const pool = getPoolOrThrow(params.pid.toI32());
  const relic = getRelicOrThrow(params.relicId.toI32());
  const snapshot = getOrCreateDailyPoolSnapshot(
    relic.pid,
    event.block.timestamp.toI32()
  );
  const scaledAmount = scaleDown(params.amount, 18);

  pool.totalBalance = pool.totalBalance.minus(scaledAmount);
  pool.save();
  relic.balance = relic.balance.minus(scaledAmount);
  relic.save();

  snapshot.totalDeposited = snapshot.totalDeposited.minus(scaledAmount);
  snapshot.save();
}

export function emergencyWithdraw(event: EmergencyWithdraw): void {
  const params = event.params;

  const pool = getPoolOrThrow(params.pid.toI32());
  const relic = getRelicOrThrow(params.relicId.toI32());
  const snapshot = getOrCreateDailyPoolSnapshot(
    relic.pid,
    event.block.timestamp.toI32()
  );
  const scaledAmount = scaleDown(params.amount, 18);
  pool.totalBalance = pool.totalBalance.minus(scaledAmount);
  pool.save();
  relic.balance = BigDecimal.zero();
  relic.save();

  snapshot.totalDeposited = snapshot.totalDeposited.minus(scaledAmount);
  snapshot.save();
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
  const relicTo = getRelicOrThrow(params.toId.toI32());

  const scaledAmount = scaleDown(params.amount, 18);

  relicFrom.balance = relicFrom.balance.minus(scaledAmount);
  relicFrom.save();
  relicTo.balance = scaledAmount;
  relicTo.entryTimestamp = relicFrom.entryTimestamp;
  relicTo.save();
}

export function shift(event: Shift): void {
  const params = event.params;

  const relicFrom = getRelicOrThrow(params.fromId.toI32());
  const relicTo = getRelicOrThrow(params.toId.toI32());

  const scaledAmount = scaleDown(params.amount, 18);

  const reliquaryContract = ReliquaryContract.bind(dataSource.address());
  const positionInfoRelicTo = reliquaryContract.getPositionForId(params.toId);

  relicFrom.balance = relicFrom.balance.minus(scaledAmount);
  relicFrom.save();
  relicTo.balance = relicTo.balance.plus(scaledAmount);
  relicTo.entryTimestamp = positionInfoRelicTo.entry.toI32();
  relicTo.save();
}

export function merge(event: Merge): void {
  const params = event.params;

  const relicFrom = getRelicOrThrow(params.fromId.toI32());
  const relicTo = getRelicOrThrow(params.toId.toI32());

  const scaledAmount = scaleDown(params.amount, 18);

  const reliquaryContract = ReliquaryContract.bind(dataSource.address());
  const positionInfoRelicTo = reliquaryContract.getPositionForId(params.toId);

  relicFrom.balance = BigDecimal.zero();
  relicFrom.save();
  relicTo.balance = relicTo.balance.plus(scaledAmount);
  relicTo.entryTimestamp = positionInfoRelicTo.entry.toI32();
  relicTo.save();
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
    const snapshot = getOrCreateDailyPoolSnapshot(
      relic.pid,
      event.block.timestamp.toI32()
    );
    snapshot.relicCount = pool.relicCount;
    snapshot.save();
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
    const userTo = getOrCreateUser(Address.fromBytes(relic.user));
    relic.user = userTo.id;
    relic.save();
  }
}

export function emissionUpdate(event: EmissionUpdate): void {
  const emissionCurve = getOrCreateEmissionCurve(dataSource.address());
  emissionCurve.rewardPerSecond = scaleDown(event.params.rewardsPerSecond, 18);
  emissionCurve.save();
}
