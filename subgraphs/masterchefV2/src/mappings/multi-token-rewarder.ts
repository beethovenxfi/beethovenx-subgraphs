import { log } from '@graphprotocol/graph-ts'
import { HarvestAction } from '../../generated/schema'
import { LogRewardsPerSecond } from '../../generated/templates/MultiTokenRewarder/MultiTokenRewarder'
import { LogOnReward } from '../../generated/templates/MultiTokenRewarder/MultiTokenRewarder'
import { getRewarder, getRewardToken, getUser } from '../entities'

export function logRewardsPerSecond(event: LogRewardsPerSecond): void {
    const rewardTokens = event.params.rewardTokens
    const rewardsPerSecond = event.params.rewardsPerSecond
    log.info('[MasterChefV2:Rewarder] Log Rewards Per Second for MultiToken rewarder. rewards {}', [
        rewardsPerSecond.toString(),
    ])

    const rewarder = getRewarder(event.address, event.block)
    for (let i = 0; i < rewardTokens.length; i++) {
        const rewardToken = getRewardToken(rewarder.id, rewardTokens[i], event.block)
        rewardToken.rewardPerSecond = rewardsPerSecond[i]
        rewardToken.save()
    }
}

export function logOnReward(event: LogOnReward): void {
    const user = getUser(event.params.user, event.params.pid, event.block)

    const harvest = new HarvestAction(`${user.id}-${event.params.rewardToken.toHex()}-${event.block.timestamp}`)
    harvest.user = user.id
    harvest.token = event.params.rewardToken
    harvest.amount = event.params.amount
    harvest.block = event.block.number
    harvest.timestamp = event.block.timestamp
    harvest.save()
}
