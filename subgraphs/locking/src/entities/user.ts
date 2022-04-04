import { Address, ethereum } from "@graphprotocol/graph-ts";
import { BIG_DECIMAL_ZERO } from "../constants";
import { User } from "../../generated/schema";
import { getLocker } from "./locker";
import { dataSource } from "@graphprotocol/graph-ts/index";

export function getUser(address: Address, block: ethereum.Block): User {
  const uid = address.toHex();
  let user = User.load(uid);

  if (user === null) {
    user = new User(uid);
    user.address = address;
    user.totalLockedAmount = BIG_DECIMAL_ZERO;
    user.collectedKickRewardAmount = BIG_DECIMAL_ZERO;
    user.totalLostThroughKick = BIG_DECIMAL_ZERO;
    user.locker = dataSource.address().toHex();
  }

  user.block = block.number;
  user.timestamp = block.timestamp;

  user.save();

  return user as User;
}
