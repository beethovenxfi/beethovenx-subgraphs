import {
  KickReward,
  Locked,
  RewardAdded,
  RewardPaid,
  SetKickIncentive,
  Withdrawn,
} from "../../generated/Locker/FBeetsLocker";
import { getLockingPeriod } from "../entities/locking-period";
import { getRewardToken } from "../entities/reward-token";
import { BigDecimal } from "@graphprotocol/graph-ts";
import { getClaimedReward } from "../entities/claimed-reward";
import { getLocker } from "../entities/locker";
import { getUser } from "../entities/user";
import { BIG_DECIMAL_1E18 } from "../constants";

export function locked(event: Locked): void {
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

export function withdrawn(event: Withdrawn): void {
  const locker = getLocker(event.block);
  const withdrawnAmount = event.params._amount.divDecimal(BIG_DECIMAL_1E18);

  locker.totalLockedAmount = locker.totalLockedAmount.minus(withdrawnAmount);
  locker.save();

  const user = getUser(event.params._user, event.block);
  user.totalLockedAmount = user.totalLockedAmount.minus(withdrawnAmount);
  user.save();
}

export function rewardAdded(event: RewardAdded): void {
  const rewardToken = getRewardToken(event.params._token, event.block);

  const decimalDivisor = BigDecimal.fromString(`1e${rewardToken.decimals}`);
  rewardToken.totalRewardAmount = rewardToken.totalRewardAmount.plus(
    event.params._reward.divDecimal(decimalDivisor)
  );
  rewardToken.rewardRate = event.params._rewardRate.divDecimal(decimalDivisor);
  rewardToken.rewardPeriodFinish = event.params._periodFinish;
  rewardToken.save();
}

export function rewardPaid(event: RewardPaid): void {
  const rewardToken = getRewardToken(event.params._rewardsToken, event.block);

  const decimalDivisor = BigDecimal.fromString(`1e${rewardToken.decimals}`);
  const reward = getClaimedReward(
    event.params._user,
    event.params._rewardsToken,
    event.block
  );
  reward.amount = reward.amount.plus(
    event.params._reward.divDecimal(decimalDivisor)
  );
  reward.save();
}

export function setKickIncentive(event: SetKickIncentive): void {
  const locker = getLocker(event.block);
  locker.kickRewardPerEpoch = event.params._kickRewardPerEpoch;
  locker.kickRewardEpochDelay = event.params._kickRewardEpochDelay;
  locker.save();
}

export function kickReward(event: KickReward): void {
  const beneficiary = getUser(event.params._user, event.block);
  const reward = event.params._reward.divDecimal(BIG_DECIMAL_1E18);

  beneficiary.collectedKickRewardAmount =
    beneficiary.collectedKickRewardAmount.plus(reward);
  beneficiary.save();

  const kicked = getUser(event.params._kicked, event.block);
  kicked.totalLostThroughKick = kicked.totalLostThroughKick.plus(reward);
  kicked.save();
}
