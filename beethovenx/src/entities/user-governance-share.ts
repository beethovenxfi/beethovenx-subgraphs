import { ethereum } from "@graphprotocol/graph-ts/index";
import { Address, dataSource } from "@graphprotocol/graph-ts";
import { BIG_DECIMAL_ZERO } from "../constants";
import { getUser } from "./user";
import { UserGovernanceShare } from "../../generated/schema";
import { getGovernanceShare } from "./governance-token";

export function getUserGovernanceTokenBalance(
  userAddress: Address,
  block: ethereum.Block
): UserGovernanceShare {
  const id = dataSource.address().concat(userAddress);
  let userGovernanceShare = UserGovernanceShare.load(id);
  if (userGovernanceShare === null) {
    const user = getUser(userAddress);
    const governanceShare = getGovernanceShare(block);
    userGovernanceShare = new UserGovernanceShare(id);
    userGovernanceShare.user = user.id;
    userGovernanceShare.userAddress = userAddress;
    userGovernanceShare.governanceShare = governanceShare.id;
    userGovernanceShare.balance = BIG_DECIMAL_ZERO;
  }
  userGovernanceShare.block = block.number;
  userGovernanceShare.timestamp = block.timestamp;
  userGovernanceShare.save();
  return userGovernanceShare;
}
