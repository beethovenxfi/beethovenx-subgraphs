import { ethereum } from "@graphprotocol/graph-ts/index";
import { LockingPeriod } from "../../generated/schema";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BIG_DECIMAL_ZERO } from "../constants";

export function getLockingPeriod(
  userAddress: Address,
  epoch: BigInt,
  block: ethereum.Block
): LockingPeriod {
  const lockingPeriodId = `${userAddress.toHex()}-${epoch.toHex()}`;

  let lockingPeriod = LockingPeriod.load(lockingPeriodId);

  if (lockingPeriod === null) {
    lockingPeriod = new LockingPeriod(lockingPeriodId);
    lockingPeriod.epoch = epoch;
    lockingPeriod.user = userAddress.toHex();
    lockingPeriod.lockAmount = BIG_DECIMAL_ZERO;
  }

  lockingPeriod.block = block.number;
  lockingPeriod.timestamp = block.timestamp;
  lockingPeriod.save();
  return lockingPeriod as LockingPeriod;
}
