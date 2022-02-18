import {
  KickReward,
  Locked,
  RewardAdded,
  RewardPaid,
  SetKickIncentive,
  Withdrawn,
} from "../../generated/Locker/FBeetsLocker";
import { getLocker, getUser } from "../entities";
import { BIG_DECIMAL_1E18 } from "../../../../packages/constants";
import { getLockingPeriod } from "../entities/locking-period";
import { getRewardToken } from "../entities/reward-token";
import { BigDecimal } from "@graphprotocol/graph-ts";
import { getReward } from "../entities/reward";
import { getRewarder } from "../../../masterchefV2/src/entities";

export function locked(event: Locked) {
  const locker = getLocker(event.block);
  const lockedAmount = event.params._lockedAmount.divDecimal(BIG_DECIMAL_1E18);

  locker.totalLockedAmount = locker.totalLockedAmount.plus(lockedAmount);
  locker.save();

  const user = getUser(event.params._user, event.block);
  user.totalLockedAmount = user.totalLockedAmount.plus(lockedAmount);
  user.save();

  const lockingPeriod = getLockingPeriod(
    event.params._user,
    event.params._epoch,
    event.block
  );
  lockingPeriod.lockAmount = lockingPeriod.lockAmount.plus(lockedAmount);
  lockingPeriod.save();
}

export function withdrawn(event: Withdrawn) {
  const locker = getLocker(event.block);
  const withdrawnAmount = event.params._amount.divDecimal(BIG_DECIMAL_1E18);

  locker.totalLockedAmount = locker.totalLockedAmount.minus(withdrawnAmount);
  locker.save();

  const user = getUser(event.params._user, event.block);
  user.totalLockedAmount = user.totalLockedAmount.minus(withdrawnAmount);
  user.save();
}

export function rewardAdded(event: RewardAdded) {
  const { _rewardRate, _reward, _token, _periodFinish } = event.params;
  const rewardToken = getRewardToken(_token, event.block);

  const decimalDivisor = BigDecimal.fromString(` 1e${rewardToken.decimals}`);
  rewardToken.totalRewardAmount = rewardToken.totalRewardAmount.plus(
    _reward.divDecimal(decimalDivisor)
  );
  rewardToken.rewardRate = _rewardRate.divDecimal(decimalDivisor);
  rewardToken.rewardPeriodFinish = _periodFinish;
  rewardToken.save();
}

export function rewardPaid(event: RewardPaid) {
  const { _reward, _rewardsToken, _user } = event.params;
  const rewardToken = getRewardToken(_rewardsToken, event.block);

  const decimalDivisor = BigDecimal.fromString(` 1e${rewardToken.decimals}`);
  const reward = getReward(_user, _rewardsToken, event.block);
  reward.amount = reward.amount.plus(_reward.divDecimal(decimalDivisor));
  reward.save();
}

export function setKickIncentive(event: SetKickIncentive) {
  const { _kickRewardEpochDelay, _kickRewardPerEpoch } = event.params;
  const locker = getLocker(event.block);
  locker.kickRewardPerEpoch = _kickRewardPerEpoch;
  locker.kickRewardEpochDelay = _kickRewardEpochDelay;
  locker.save();
}

export function kickReward(event: KickReward) {
  const { _user, _reward, _kicked } = event.params;
  const beneficiary = getUser(_user, event.block);
  const reward = _reward.divDecimal(BIG_DECIMAL_1E18);

  beneficiary.collectedKickRewardAmount =
    beneficiary.collectedKickRewardAmount.plus(reward);
  beneficiary.save();

  const kicked = getUser(_kicked, event.block);
  kicked.totalLostThroughKick = kicked.totalLostThroughKick.plus(reward);
  kicked.save();
}
