import { log } from "@graphprotocol/graph-ts";
import { LogRewardsPerSecond } from "../../generated/templates/MultiTokenRewarder/MultiTokenRewarder";
import { getRewarder, getRewardToken } from "../entities";

export function logRewardsPerSecond(event: LogRewardsPerSecond): void {
  const rewardTokens = event.params.rewardTokens;
  const rewardsPerSecond = event.params.rewardsPerSecond;
  log.info(
    "[MasterChefV2:Rewarder] Log Rewards Per Second for MultiToken rewarder. tokens {}, rewards {}",
    [rewardTokens.toString(), rewardsPerSecond.toString()]
  );

  const rewarder = getRewarder(event.address, event.block);
  for (let i = 0; i < rewardTokens.length; i++) {
    const rewardToken = getRewardToken(
      rewarder.id,
      rewardTokens[i],
      event.block
    );
    rewardToken.rewardPerSecond = rewardsPerSecond[i];
    rewardToken.save();
  }
}
