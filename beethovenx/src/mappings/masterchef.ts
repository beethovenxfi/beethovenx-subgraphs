import {
  Deposit,
  EmergencyWithdraw,
  Harvest,
  LogPoolAddition,
  LogSetPool,
  UpdateEmissionRate,
  Withdraw,
} from "../../generated/MasterChef/MasterChef";

import { Address, BigDecimal, Bytes, log } from "@graphprotocol/graph-ts";
import {
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_ZERO,
  BIG_INT_ONE,
  BIG_INT_ZERO,
} from "../constants";

import { HarvestAction } from "../../generated/schema";
import { getUserFarmBalance } from "../entities/user-farm-balance";
import { getToken } from "../entities/token";
import { getRewarder } from "../entities/rewarder";
import { getMasterChef } from "../entities/masterchef";
import { getFarm } from "../entities/farm";
import { BigDecimal_1e } from "../big-numbers";
import { bytesAsAddress } from "../utils";

export function logPoolAddition(event: LogPoolAddition): void {
  log.info("[MasterChef] Log Pool Addition {} {} {} {}", [
    event.params.pid.toString(),
    event.params.allocPoint.toString(),
    event.params.lpToken.toHex(),
    event.params.rewarder.toHex(),
  ]);

  const masterChef = getMasterChef(event.block);
  const farm = getFarm(event.params.pid, event.block);
  const farmToken = getToken(event.params.lpToken);
  const rewarder = getRewarder(event.params.rewarder, event.block);

  farm.token = farmToken.id;
  farm.tokenAddress = farmToken.address;
  farm.rewarder = rewarder.id;
  farm.allocPoint = event.params.allocPoint;
  farm.save();

  masterChef.totalAllocPoint = masterChef.totalAllocPoint.plus(farm.allocPoint);
  masterChef.poolCount = masterChef.poolCount.plus(BIG_INT_ONE);
  masterChef.save();
}

export function logSetPool(event: LogSetPool): void {
  log.info("[MasterChef] Log Set Pool {} {} {} {}", [
    event.params.pid.toString(),
    event.params.allocPoint.toString(),
    event.params.rewarder.toHex(),
    event.params.overwrite == true ? "true" : "false",
  ]);

  const masterChef = getMasterChef(event.block);
  const pool = getFarm(event.params.pid, event.block);

  if (event.params.overwrite == true) {
    const rewarder = getRewarder(event.params.rewarder, event.block);
    pool.rewarder = rewarder.id;
  }

  masterChef.totalAllocPoint = masterChef.totalAllocPoint.plus(
    event.params.allocPoint.minus(pool.allocPoint)
  );
  masterChef.save();

  pool.allocPoint = event.params.allocPoint;
  pool.save();
}

export function updateEmissionRate(event: UpdateEmissionRate): void {
  log.info("[MasterChef] Log update emission rate {} {}", [
    event.params.user.toString(),
    event.params._beetsPerSec.toString(),
  ]);

  const masterChef = getMasterChef(event.block);
  masterChef.emissionPerBlock = event.params._beetsPerSec;
  masterChef.save();
}

export function deposit(event: Deposit): void {
  log.info("[MasterChef] Log Deposit {} {} {} {}", [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex(),
  ]);

  const farm = getFarm(event.params.pid, event.block);
  const userFarmBalance = getUserFarmBalance(
    event.params.pid,
    event.params.to,
    event.block
  );
  const token = getToken(bytesAsAddress(farm.token));

  const amountDecimal = event.params.amount.divDecimal(
    BigDecimal_1e(token.decimals)
  );
  farm.balance = farm.balance.plus(amountDecimal);
  if (
    userFarmBalance.balance === BIG_DECIMAL_ZERO &&
    event.params.amount > BIG_INT_ZERO
  ) {
    farm.userCount = farm.userCount.plus(BIG_INT_ONE);
  }
  farm.save();

  userFarmBalance.balance = userFarmBalance.balance.plus(amountDecimal);
  userFarmBalance.save();
}

export function withdraw(event: Withdraw): void {
  log.info("[MasterChef] Log Withdraw {} {} {} {}", [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex(),
  ]);

  const farm = getFarm(event.params.pid, event.block);
  const userFarmBalance = getUserFarmBalance(
    event.params.pid,
    event.params.to,
    event.block
  );
  const token = getToken(bytesAsAddress(farm.token));

  const amountDecimal = event.params.amount.divDecimal(
    BigDecimal_1e(token.decimals)
  );
  userFarmBalance.balance = userFarmBalance.balance.minus(amountDecimal);
  userFarmBalance.save();

  farm.balance = farm.balance.minus(amountDecimal);
  if (userFarmBalance.balance === BIG_DECIMAL_ZERO) {
    farm.userCount = farm.userCount.minus(BIG_INT_ONE);
  }
  farm.save();
}

export function emergencyWithdraw(event: EmergencyWithdraw): void {
  log.info("[MasterChef] Log Emergency Withdraw {} {} {} {}", [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex(),
  ]);

  const farm = getFarm(event.params.pid, event.block);
  const userFarmBalance = getUserFarmBalance(
    event.params.pid,
    event.params.to,
    event.block
  );
  const token = getToken(bytesAsAddress(farm.token));

  userFarmBalance.balance = BIG_DECIMAL_ZERO;
  userFarmBalance.save();

  farm.balance = farm.balance.minus(
    event.params.amount.divDecimal(BigDecimal_1e(token.decimals))
  );
  farm.userCount = farm.userCount.minus(BIG_INT_ONE);
  farm.save();
}

export function harvest(event: Harvest): void {
  log.info("[MasterChef] Log Harvest {} {} {}", [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
  ]);

  const masterChef = getMasterChef(event.block);
  const token = getToken(bytesAsAddress(masterChef.emissionToken));

  const id = event.transaction.hash
    .concat(masterChef.id)
    .concatI32(event.params.pid.toI32())
    .concat(event.params.user)
    .concat(token.id);

  const harvest = new HarvestAction(id);
  harvest.user = event.params.user;
  harvest.token = token.id;
  harvest.amount = event.params.amount.divDecimal(
    BigDecimal_1e(token.decimals)
  );
  harvest.block = event.block.number;
  harvest.timestamp = event.block.timestamp;
  harvest.save();
}
