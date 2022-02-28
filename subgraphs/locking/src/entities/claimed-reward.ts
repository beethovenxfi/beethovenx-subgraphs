import { ethereum } from "@graphprotocol/graph-ts/index";
import { ClaimedReward } from "../../generated/schema";
import { Address } from "@graphprotocol/graph-ts";
import {BIG_DECIMAL_ZERO} from "../constants";

export const getClaimedReward = (
  userAddress: Address,
  rewardToken: Address,
  block: ethereum.Block
): ClaimedReward => {
  const id = `${userAddress.toHex()}-${rewardToken.toHex()}`;
  let reward = ClaimedReward.load(id);

  if (reward === null) {
    reward = new ClaimedReward(id);
    reward.token = rewardToken;
    reward.amount = BIG_DECIMAL_ZERO
  }
  reward.block = block.number;
  reward.timestamp = block.timestamp;
  reward.save();

  return reward as ClaimedReward;
};
