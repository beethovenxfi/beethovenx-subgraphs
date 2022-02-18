import { User } from "../../generated/schema";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { BIG_DECIMAL_ZERO } from "const";

export function getUser(address: Address, block: ethereum.Block): User {
  const uid = address.toHex();
  let user = User.load(uid);

  if (user === null) {
    user = new User(uid);
    user.totalLockedAmount = BIG_DECIMAL_ZERO;
    user.collectedKickRewardAmount = BIG_DECIMAL_ZERO;
    user.totalLostThroughKick = BIG_DECIMAL_ZERO;
  }

  user.block = block.number;
  user.timestamp = block.timestamp;

  user.save();

  return user as User;
}
