import { BigDecimal, log } from "@graphprotocol/graph-ts";
import { HarvestAction } from "../../generated/schema";
import {
  LogOnReward,
  LogRewardsPerSecond,
} from "../../generated/templates/MultiTokenRewarder/MultiTokenRewarder";
import { getToken } from "../entities/token";
import { getRewardToken } from "../entities/reward-token";
import { getRewarder } from "../entities/rewarder";

export function logRewardsPerSecond(event: LogRewardsPerSecond): void {
  const rewardTokens = event.params.rewardTokens;
  const rewardsPerSecond = event.params.rewardsPerSecond;
  log.info(
    "[MasterChef: Rewarder] Log Rewards Per Second for MultiToken rewarder. rewards {}",
    [rewardsPerSecond.toString()]
  );

  const rewarder = getRewarder(event.address, event.block);
  for (let i = 0; i < rewardTokens.length; i++) {
    const rewardToken = getRewardToken(
      rewarder.id,
      rewardTokens[i],
      event.block
    );
    const token = getToken(rewardTokens[i]);
    rewardToken.rewardPerSecond = rewardsPerSecond[i].divDecimal(
      BigDecimal.fromString(token.decimals.toString())
    );
    rewardToken.save();
  }
}

export function logOnReward(event: LogOnReward): void {
  const token = getToken(event.params.rewardToken);

  const harvest = new HarvestAction(
    event.params.user.concat(token.id).concatI32(event.block.timestamp.toI32())
  );
  harvest.user = event.params.user;
  harvest.token = token.id;
  harvest.amount = event.params.amount.divDecimal(
    BigDecimal.fromString(token.decimals.toString())
  );
  harvest.block = event.block.number;
  harvest.timestamp = event.block.timestamp;
  harvest.save();
}
