import { Address, ethereum } from "@graphprotocol/graph-ts/index";
import { Rewarder, RewardToken } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";
import { Bytes } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/MasterChef/ERC20";
import { getToken } from "./token";

export function getRewardToken(
  rewarderId: Bytes,
  tokenAddress: Address,
  block: ethereum.Block
): RewardToken {
  const id = rewarderId.concat(tokenAddress);
  let rewardToken = RewardToken.load(id);
  if (rewardToken == null) {
    const token = getToken(tokenAddress);
    rewardToken = new RewardToken(id);
    rewardToken.rewarder = rewarderId;
    rewardToken.token = token.id;
    rewardToken.tokenAddress = tokenAddress;
    rewardToken.rewardPerSecond = BIG_DECIMAL_ZERO;
  }
  rewardToken.block = block.number;
  rewardToken.timestamp = block.timestamp;
  rewardToken.save();
  return rewardToken;
}
