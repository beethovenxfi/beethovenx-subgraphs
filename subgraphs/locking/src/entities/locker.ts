import { dataSource, ethereum } from "@graphprotocol/graph-ts/index";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../../../../packages/constants";
import { Locker } from "../../generated/schema";
import { FBeetsLocker as LockerContract } from "../../generated/Locker/FBeetsLocker";

export function getLocker(block: ethereum.Block): Locker {
  let locker = Locker.load(dataSource.address().toHex());
  if (locker === null) {
    const contract: LockerContract = LockerContract.bind(dataSource.address());
    locker = new Locker(dataSource.address().toHex());
    locker.address = dataSource.address();
    locker.name = contract.name();
    locker.decimals = contract.decimals();
    locker.symbol = contract.symbol();
    locker.lockDuration = contract.lockDuration();
    locker.epochDuration = contract.epochDuration();
    locker.totalLockedAmount = BIG_DECIMAL_ZERO;
    locker.kickRewardEpochDelay = contract.kickRewardEpochDelay();
    locker.kickRewardPerEpoch = contract.kickRewardPerEpoch();
  }
  locker.block = block.number;
  locker.timestamp = block.timestamp;
  locker.save();
  return locker as Locker;
}
