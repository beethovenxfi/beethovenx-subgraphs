import { ADDRESS_ZERO, BIG_INT_ZERO } from "const";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { CloneRewarderTime as CloneRewarderTimeContract } from "../../generated/templates/CloneRewarderTime/CloneRewarderTime";
import { CloneRewarderTime as CloneRewarderTimeTemplate } from "../../generated/templates";
import { Rewarder } from "../../generated/schema";

export function getRewarder(address: Address, block: ethereum.Block): Rewarder {
  let rewarder = Rewarder.load(address.toHex());

  if (rewarder === null) {
    rewarder = new Rewarder(address.toHex());
    rewarder.rewardToken = ADDRESS_ZERO;
    rewarder.rewardPerSecond = BIG_INT_ZERO;

    const rewarderContract = CloneRewarderTimeContract.bind(address);
    let rewardTokenResult = rewarderContract.try_rewardToken();
    let rewardRateResult = rewarderContract.try_rewardPerSecond();

    if (!rewardTokenResult.reverted) {
      rewarder.rewardToken = rewardTokenResult.value;
    }
    if (!rewardRateResult.reverted) {
      rewarder.rewardPerSecond = rewardRateResult.value;
      CloneRewarderTimeTemplate.create(address);
    }
  }

  rewarder.timestamp = block.timestamp;
  rewarder.block = block.number;
  rewarder.save();

  updateRewarder(address);

  return rewarder as Rewarder;
}

export function updateRewarder(address: Address): void {
  let rewarder = Rewarder.load(address.toHex());

  if (rewarder != null) {
    rewarder.save();
  }
}
