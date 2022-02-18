import { ethereum } from "@graphprotocol/graph-ts/index";
import { BIG_DECIMAL_ZERO } from "../../../../packages/constants";
import { LockingPeriod } from "../../generated/schema";
import { Address, BigInt } from "@graphprotocol/graph-ts";

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
