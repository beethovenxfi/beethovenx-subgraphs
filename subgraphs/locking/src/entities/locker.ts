import { dataSource, ethereum } from "@graphprotocol/graph-ts/index";
import { Locker } from "../../generated/schema";
import { FBeetsLocker as LockerContract } from "../../generated/Locker/FBeetsLocker";
import { BIG_DECIMAL_ZERO } from "../constants";

export function getLocker(block: ethereum.Block): Locker {
  //todo: change for tests, see issue https://github.com/LimeChain/matchstick/issues/297
  // const dataSourceAddress = Address.fromString(dataSource.address().toString());
  const dataSourceAddress = dataSource.address();
  let locker = Locker.load(dataSourceAddress.toHex());
  if (locker === null) {
    const contract: LockerContract = LockerContract.bind(dataSourceAddress);
    locker = new Locker(dataSourceAddress.toHex());
    locker.address = dataSourceAddress;
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
