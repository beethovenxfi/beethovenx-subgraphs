import { Address, log } from "@graphprotocol/graph-ts";
import { LogRewardPerSecond } from "../../generated/templates/SingleTokenRewarder/SingleTokenRewarder";
import { getRewarder, getRewardToken } from "../entities";
import { SingleTokenRewarder as SingleTokenRewarderContract } from "../../generated/templates/SingleTokenRewarder/SingleTokenRewarder";

export function logRewardPerSecond(event: LogRewardPerSecond): void {
  log.info(
    "[MasterChefV2:Rewarder] Log Reward Per Second for single token rewarder {}",
    [event.params.rewardPerSecond.toString()]
  );

  const rewarder = getRewarder(event.address, event.block);
  const rewarderContract = SingleTokenRewarderContract.bind(event.address);
  const token = rewarderContract.rewardToken();
  const rewardToken = getRewardToken(rewarder.id, token, event.block);
  rewardToken.rewardPerSecond = event.params.rewardPerSecond;
  rewardToken.save();
}
