import { ADDRESS_ZERO, BIG_INT_ZERO } from '../constants'
import { Address, ethereum } from '@graphprotocol/graph-ts'
import { SingleTokenRewarder as SingleTokenRewarderContract } from '../../generated/templates/SingleTokenRewarder/SingleTokenRewarder'
import { SingleTokenRewarder as SingleTokenRewarderTemplate } from '../../generated/templates'
import { MultiTokenRewarder as MultiTokenRewarderContract } from '../../generated/templates/MultiTokenRewarder/MultiTokenRewarder'
import { MultiTokenRewarder as MultiTokenRewarderTemplate } from '../../generated/templates'

import { Rewarder, RewardToken } from '../../generated/schema'
import { ERC20 } from '../../generated/MasterChefV2/ERC20'
import { log } from '@graphprotocol/graph-ts'

export function getRewarder(address: Address, block: ethereum.Block): Rewarder {
    let rewarder = Rewarder.load(address.toHex())

    if (rewarder === null) {
        rewarder = new Rewarder(address.toHex())

        if (address != ADDRESS_ZERO) {
            const rewarderContract = SingleTokenRewarderContract.bind(address)
            let rewardTokenResult = rewarderContract.try_rewardToken()
            if (!rewardTokenResult.reverted) {
                const rewardToken = getRewardToken(rewarder.id, rewardTokenResult.value, block)
                rewardToken.rewardPerSecond = rewarderContract.rewardPerSecond()
                rewardToken.token = rewarderContract.rewardToken()
                rewardToken.save()
                SingleTokenRewarderTemplate.create(address)
            } else {
                const multiTokenRewarderContract = MultiTokenRewarderContract.bind(address)
                const tokenConfigs = multiTokenRewarderContract.getRewardTokenConfigs()
                for (let i = 0; i < tokenConfigs.length; i++) {
                    const rewardToken = getRewardToken(rewarder.id, tokenConfigs[i].rewardToken, block)
                    rewardToken.rewardPerSecond = tokenConfigs[i].rewardsPerSecond
                    rewardToken.save()
                }
                MultiTokenRewarderTemplate.create(address)
            }
        } else {
        }
    }

    rewarder.timestamp = block.timestamp
    rewarder.block = block.number
    rewarder.save()

    updateRewarder(address, block)

    return rewarder as Rewarder
}

export function getRewardToken(rewarderId: string, address: Address, block: ethereum.Block): RewardToken {
    let rewardToken = RewardToken.load(`${rewarderId}-${address.toHex()}`)
    if (rewardToken == null) {
        const erc20 = ERC20.bind(address)
        rewardToken = new RewardToken(`${rewarderId}-${address.toHex()}`)
        rewardToken.rewarder = rewarderId
        rewardToken.token = address
        if (rewardToken.token != ADDRESS_ZERO) {
            rewardToken.decimals = erc20.decimals()
            rewardToken.symbol = erc20.symbol()
        } else {
            rewardToken.decimals = 18
            rewardToken.symbol = 'NULL'
        }
        rewardToken.rewardPerSecond = BIG_INT_ZERO
    }
    rewardToken.block = block.number
    rewardToken.timestamp = block.timestamp
    rewardToken.save()
    return rewardToken
}

export function updateRewarder(address: Address, block: ethereum.Block): void {
    let rewarder = Rewarder.load(address.toHex())

    if (rewarder != null) {
        log.info('[MasterChefV2:Rewarder] Update Rewarder {}', [address.toHex()])
        if (address != ADDRESS_ZERO) {
            const rewarderContract = SingleTokenRewarderContract.bind(address)
            let rewardTokenResult = rewarderContract.try_rewardToken()
            if (!rewardTokenResult.reverted) {
                const rewardToken = getRewardToken(rewarder.id, rewardTokenResult.value, block)
                rewardToken.rewardPerSecond = rewarderContract.rewardPerSecond()
                rewardToken.token = rewarderContract.rewardToken()
                rewardToken.save()
            } else {
                const multiTokenRewarderContract = MultiTokenRewarderContract.bind(address)
                const tokenConfigs = multiTokenRewarderContract.getRewardTokenConfigs()
                for (let i = 0; i < tokenConfigs.length; i++) {
                    const rewardToken = getRewardToken(rewarder.id, tokenConfigs[i].rewardToken, block)
                    rewardToken.rewardPerSecond = tokenConfigs[i].rewardsPerSecond
                    rewardToken.save()
                }
            }
        }

        rewarder.save()
    }
}
