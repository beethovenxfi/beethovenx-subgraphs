import { BigDecimal, log } from "@graphprotocol/graph-ts";
import { HarvestAction } from "../../generated/schema";
import {
  LogOnReward,
  LogRewardPerSecond,
  SingleTokenRewarder as SingleTokenRewarderContract,
} from "../../generated/templates/SingleTokenRewarder/SingleTokenRewarder";
import { getRewardToken } from "../entities/reward-token";
import { getRewarder } from "../entities/rewarder";
import { getToken } from "../entities/token";
import { BigDecimal_1e } from "../big-numbers";

export function logRewardPerSecond(event: LogRewardPerSecond): void {
  log.info(
    "[MasterChef: Rewarder] Log Reward Per Second for single token rewarder {}",
    [event.params.rewardPerSecond.toString()]
  );

  const rewarder = getRewarder(event.address, event.block);
  const rewarderContract = SingleTokenRewarderContract.bind(event.address);
  const tokenAddress = rewarderContract.rewardToken();
  const token = getToken(tokenAddress);
  const rewardToken = getRewardToken(rewarder.id, tokenAddress, event.block);
  rewardToken.rewardPerSecond = event.params.rewardPerSecond.divDecimal(
    BigDecimal_1e(token.decimals)
  );
  rewardToken.save();
}

export function logOnReward(event: LogOnReward): void {
  const rewarderContract = SingleTokenRewarderContract.bind(event.address);
  const tokenAddress = rewarderContract.rewardToken();
  const token = getToken(tokenAddress);

  const id = event.transaction.hash
    .concat(event.address)
    .concat(event.params.user)
    .concat(token.id);

  const harvest = new HarvestAction(id);
  harvest.user = event.params.user;
  harvest.token = token.id;
  harvest.amount = event.params.amount.divDecimal(
    BigDecimal_1e(token.decimals)
  );
  harvest.block = event.block.number;
  harvest.timestamp = event.block.timestamp;
  harvest.save();
}
