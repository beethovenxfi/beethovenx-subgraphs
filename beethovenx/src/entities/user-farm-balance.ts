import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { UserFarmBalance } from "../../generated/schema";
import { BIG_DECIMAL_ZERO } from "../constants";
import { getUser } from "./user";

export function getUserFarmBalance(
  farmId: BigInt,
  userAddress: Address,
  block: ethereum.Block
): UserFarmBalance {
  const id = userAddress.concatI32(farmId.toI32());
  let farmBalance = UserFarmBalance.load(id);

  if (farmBalance === null) {
    const user = getUser(userAddress);
    farmBalance = new UserFarmBalance(id);
    farmBalance.farmId = farmId;
    farmBalance.farm = Bytes.fromI32(farmId.toI32());
    farmBalance.userAddress = userAddress;
    farmBalance.user = user.id;
    farmBalance.balance = BIG_DECIMAL_ZERO;
  }
  farmBalance.block = block.number;
  farmBalance.timestamp = block.timestamp;
  farmBalance.save();

  return farmBalance as UserFarmBalance;
}
