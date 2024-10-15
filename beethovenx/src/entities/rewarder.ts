import { ADDRESS_ZERO } from "../constants";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { SingleTokenRewarder as SingleTokenRewarderContract } from "../../generated/templates/SingleTokenRewarder/SingleTokenRewarder";
import {
  MultiTokenRewarder as MultiTokenRewarderTemplate,
  SingleTokenRewarder as SingleTokenRewarderTemplate,
} from "../../generated/templates";
import { MultiTokenRewarder as MultiTokenRewarderContract } from "../../generated/templates/MultiTokenRewarder/MultiTokenRewarder";

import { Rewarder } from "../../generated/schema";
import { getRewardToken } from "./reward-token";
import { getToken } from "./token";
import { BigDecimal_1e } from "../big-numbers";

export function getRewarder(address: Address, block: ethereum.Block): Rewarder {
  let rewarder = Rewarder.load(address);

  if (rewarder === null) {
    rewarder = new Rewarder(address);
    rewarder.address = address;

    if (address != ADDRESS_ZERO) {
      const rewarderContract = SingleTokenRewarderContract.bind(address);
      let rewardTokenResult = rewarderContract.try_rewardToken();
      if (!rewardTokenResult.reverted) {
        const rewardToken = getRewardToken(
          rewarder.id,
          rewardTokenResult.value,
          block
        );
        const tokenAddress = rewarderContract.rewardToken();
        const token = getToken(tokenAddress);
        rewardToken.rewardPerSecond = rewarderContract
          .rewardPerSecond()
          .divDecimal(BigDecimal_1e(token.decimals));
        rewardToken.token = token.id;
        rewardToken.save();
        SingleTokenRewarderTemplate.create(address);
      } else {
        const multiTokenRewarderContract =
          MultiTokenRewarderContract.bind(address);
        const tokenConfigs = multiTokenRewarderContract.getRewardTokenConfigs();
        for (let i = 0; i < tokenConfigs.length; i++) {
          const rewardToken = getRewardToken(
            rewarder.id,
            tokenConfigs[i].rewardToken,
            block
          );

          const token = getToken(tokenConfigs[i].rewardToken);
          rewardToken.token = token.id;
          rewardToken.tokenAddress = token.address;
          rewardToken.rewardPerSecond = tokenConfigs[
            i
          ].rewardsPerSecond.divDecimal(BigDecimal_1e(token.decimals));
          rewardToken.save();
        }
        MultiTokenRewarderTemplate.create(address);
      }
    }
  }

  rewarder.save();
  return rewarder as Rewarder;
}
