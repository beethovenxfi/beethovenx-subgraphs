import { ethereum } from "@graphprotocol/graph-ts/index";
import { RewardToken } from "../../generated/schema";
import { Address } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Locker/ERC20";
import {BIG_DECIMAL_ZERO, BIG_INT_ZERO} from "../constants";

export const getRewardToken = (
  address: Address,
  block: ethereum.Block
): RewardToken => {
  let rewardToken = RewardToken.load(address.toHex());
  const erc20 = ERC20.bind(address);

  if (rewardToken === null) {
    rewardToken = new RewardToken(address.toHex());
    rewardToken.rewardToken = address;
    rewardToken.decimals = erc20.decimals();
    rewardToken.totalRewardAmount = BIG_DECIMAL_ZERO;
    rewardToken.rewardRate = BIG_DECIMAL_ZERO;
    rewardToken.rewardPeriodFinish = BIG_INT_ZERO;
  }
  rewardToken.block = block.number;
  rewardToken.timestamp = block.timestamp;
  rewardToken.save();

  return rewardToken as RewardToken;
};
