import { log } from '@graphprotocol/graph-ts'
import { HarvestAction } from '../../generated/schema'
import {
    LogOnReward,
    LogRewardPerSecond,
    SingleTokenRewarder as SingleTokenRewarderContract,
} from '../../generated/templates/SingleTokenRewarder/SingleTokenRewarder'
import { getRewarder, getRewardToken, getUser } from '../entities'

export function logRewardPerSecond(event: LogRewardPerSecond): void {
    log.info('[MasterChefV2:Rewarder] Log Reward Per Second for single token rewarder {}', [
        event.params.rewardPerSecond.toString(),
    ])

    const rewarder = getRewarder(event.address, event.block)
    const rewarderContract = SingleTokenRewarderContract.bind(event.address)
    const token = rewarderContract.rewardToken()
    const rewardToken = getRewardToken(rewarder.id, token, event.block)
    rewardToken.rewardPerSecond = event.params.rewardPerSecond
    rewardToken.save()
}

export function logOnReward(event: LogOnReward): void {
    const rewarderContract = SingleTokenRewarderContract.bind(event.address)
    const user = getUser(event.params.user, event.params.pid, event.block)
    const token = rewarderContract.rewardToken()
    const harvest = new HarvestAction(`${user.id}-${token.toHex()}-${event.block.timestamp}`)
    harvest.user = user.id
    harvest.token = token
    harvest.amount = event.params.amount
    harvest.block = event.block.number
    harvest.timestamp = event.block.timestamp
    harvest.save()
}
