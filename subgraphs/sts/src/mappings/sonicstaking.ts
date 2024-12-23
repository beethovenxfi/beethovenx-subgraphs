import { dataSource } from '@graphprotocol/graph-ts'
import {
    Delegated,
    Undelegated,
    OperatorClawBackInitiated,
    OperatorClawBackExecuted,
    Deposited,
    Donated,
} from '../../generated/Sonictaking/SonicStaking'

import { SonicStaking as StakingContract } from '../../generated/Sonictaking/SonicStaking'
import { getOrCreateSonicStaking, getOrCreateSonicStakingSnapshot, getOrCreateValidator } from '../entities'
import { scaleDown } from '../utils/numbers'

export function logDeposited(event: Deposited): void {
    updateStakingEntity()
    takeSnapshot(event.block.timestamp.toI32())
}

export function logDonated(event: Donated): void {
    updateStakingEntity()
    takeSnapshot(event.block.timestamp.toI32())
}

export function logDelegated(event: Delegated): void {
    const params = event.params
    const amountAssets = params.amountAssets
    const validatorId = params.validatorId

    const validator = getOrCreateValidator(validatorId.toString())

    validator.amountAssetsDelegated = validator.amountAssetsDelegated.plus(scaleDown(amountAssets, 18))

    validator.save()

    updateStakingEntity()
    takeSnapshot(event.block.timestamp.toI32())
}

export function logUndelegated(event: Undelegated): void {
    const params = event.params
    const amountAssets = params.amountAssets
    const validatorId = params.validatorId

    const validator = getOrCreateValidator(validatorId.toString())

    validator.amountAssetsDelegated = validator.amountAssetsDelegated.minus(scaleDown(amountAssets, 18))

    validator.save()

    updateStakingEntity()
    takeSnapshot(event.block.timestamp.toI32())
}

export function logOperatorClawBackInitiated(event: OperatorClawBackInitiated): void {
    const params = event.params
    const amountAssets = params.amountAssets
    const validatorId = params.validatorId

    const validator = getOrCreateValidator(validatorId.toString())

    validator.amountAssetsDelegated = validator.amountAssetsDelegated.minus(scaleDown(amountAssets, 18))

    validator.save()
    updateStakingEntity()
    takeSnapshot(event.block.timestamp.toI32())
}

export function logOperatorClawBackExecuted(event: OperatorClawBackExecuted): void {
    updateStakingEntity()
    takeSnapshot(event.block.timestamp.toI32())
}

function takeSnapshot(timestamp: i32): void {
    const stakingSnapshot = getOrCreateSonicStakingSnapshot(timestamp)

    const stakingContract = StakingContract.bind(dataSource.address())

    stakingSnapshot.totalPool = scaleDown(stakingContract.totalPool(), 18)
    stakingSnapshot.totalDelegated = scaleDown(stakingContract.totalDelegated(), 18)
    stakingSnapshot.totalAssets = scaleDown(stakingContract.totalAssets(), 18)
    stakingSnapshot.exchangeRate = scaleDown(stakingContract.getRate(), 18)
    stakingSnapshot.save()
}

function updateStakingEntity(): void {
    const staking = getOrCreateSonicStaking()

    const stakingContract = StakingContract.bind(dataSource.address())

    staking.totalPool = scaleDown(stakingContract.totalPool(), 18)
    staking.totalDelegated = scaleDown(stakingContract.totalDelegated(), 18)
    staking.totalAssets = scaleDown(stakingContract.totalAssets(), 18)
    staking.exchangeRate = scaleDown(stakingContract.getRate(), 18)
    staking.save()
}
