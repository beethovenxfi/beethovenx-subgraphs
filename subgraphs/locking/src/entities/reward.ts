import { ethereum } from "@graphprotocol/graph-ts/index";
import { Reward } from "../../generated/schema";
import { Address } from "@graphprotocol/graph-ts";

export const getReward = (
  userAddress: Address,
  rewardToken: Address,
  block: ethereum.Block
): Reward => {
  const id = `${userAddress.toHex()}-${rewardToken.toHex()}`;
  let reward = Reward.load(id);

  if (reward === null) {
    reward = new Reward(id);
    reward.token = rewardToken;
  }
  reward.block = block.number;
  reward.timestamp = block.timestamp;
  reward.save();

  return reward as Reward;
};
