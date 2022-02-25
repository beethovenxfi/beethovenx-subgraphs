import { dataSource, ethereum, log } from "@graphprotocol/graph-ts/index";
import { Locker } from "../../generated/schema";
import { FBeetsLocker as LockerContract } from "../../generated/Locker/FBeetsLocker";
import { BIG_DECIMAL_ZERO } from "../constants";
import { Address } from "@graphprotocol/graph-ts";

export function getLocker(block: ethereum.Block): Locker {
  //todo: change back - hacky so it works for testing...
  const dataSourceAddress = Address.fromString(dataSource.address().toString());
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
