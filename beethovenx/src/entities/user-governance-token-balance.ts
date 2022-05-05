import { UserGovernanceTokenBalance } from "../../generated/schema";
import { ethereum } from "@graphprotocol/graph-ts/index";
import { Address, dataSource } from "@graphprotocol/graph-ts";
import { BIG_DECIMAL_ZERO } from "../constants";
import { getUser } from "./user";
import { getToken } from "./token";

export function getUserGovernanceTokenBalance(
  userAddress: Address,
  block: ethereum.Block
): UserGovernanceTokenBalance {
  const id = dataSource.address().concat(userAddress);
  let userGovernanceTokenBalance = UserGovernanceTokenBalance.load(id);
  if (userGovernanceTokenBalance === null) {
    const user = getUser(userAddress);
    const token = getToken(dataSource.address());
    userGovernanceTokenBalance = new UserGovernanceTokenBalance(id);
    userGovernanceTokenBalance.user = user.id;
    userGovernanceTokenBalance.token = token.id;
    userGovernanceTokenBalance.balance = BIG_DECIMAL_ZERO;
  }
  userGovernanceTokenBalance.block = block.number;
  userGovernanceTokenBalance.timestamp = block.timestamp;
  userGovernanceTokenBalance.save();
  return userGovernanceTokenBalance;
}
