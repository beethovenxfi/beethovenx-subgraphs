import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { User } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function getUser(
  address: Address,
  pid: BigInt,
  block: ethereum.Block
): User {
  const uid = address.toHex();
  const id = pid.toString().concat("-").concat(uid);
  let user = User.load(id);

  if (user === null) {
    user = new User(id);
    user.address = address;
    user.pool = pid.toString();
    user.amount = BIG_INT_ZERO;
    user.rewardDebt = BIG_INT_ZERO;
    user.beetsHarvested = BIG_INT_ZERO;
  }

  user.timestamp = block.timestamp;
  user.block = block.number;
  user.save();

  return user as User;
}
