import {
    LogDepositLimitUpdated,
    LogDeposited,
    LogLocked,
    LogMaintenancePausedUpdated,
    LogUndelegatePausedUpdated,
    LogUndelegated,
    LogVaultHarvested,
    LogVaultWithdrawn,
    LogWithdrawPausedUpdated,
    LogWithdrawn,
} from '../../generated/FTMStaking/FTMStaking'
import { Deposit, Vault, WithdrawalRequest } from '../../generated/schema'
import { getOrCreateFtmStaking, getOrCreateFtmStakingSnapshot, getOrCreateUser } from '../entities'
import { Vault as VaultContract } from '../../generated/FTMStaking/Vault'
import { FTMStaking as StakingContract } from '../../generated/FTMStaking/FTMStaking'
import { dataSource, log } from '@graphprotocol/graph-ts'
import { scaleDown } from '../utils/numbers'

export function logLocked(event: LogLocked): void {
    const params = event.params
    const vaultAddress = params.vault
    const amount = params.amount
    const duration = params.lockupDuration

    const ftmStaking = getOrCreateFtmStaking()

    const vaultContract = VaultContract.bind(vaultAddress)
    const vault = new Vault(vaultAddress)
    vault.amountLocked = scaleDown(amount, 18)
    vault.ftmStaking = ftmStaking.id
    vault.lockupDuration = duration
    vault.lockupTimestamp = event.block.timestamp
    vault.lockExpireTimestamp = event.block.timestamp.plus(duration)
    vault.toValidatorId = vaultContract.toValidatorID()
    vault.toValidatorAddress = vaultContract.toValidator()
    vault.isHarvested = false
    vault.isWithdrawn = false
    vault.save()

    takeSnapshot(event.block.timestamp.toI32())
}

export function logUndelegated(event: LogUndelegated): void {
    const params = event.params
    const userAddress = params.user
    const amount = params.amountFTMx
    const wrId = params.wrID

    const user = getOrCreateUser(userAddress)

    const withdrawalRequest = new WithdrawalRequest(wrId.toString())
    withdrawalRequest.user = user.id
    withdrawalRequest.amount = scaleDown(amount, 18)
    withdrawalRequest.isWithdrawn = false
    withdrawalRequest.requestTime = event.block.timestamp.toI32()
    withdrawalRequest.save()

    user.save()

    takeSnapshot(event.block.timestamp.toI32())
}

export function logWithdrawn(event: LogWithdrawn): void {
    const params = event.params
    const wrId = params.wrID

    takeSnapshot(event.block.timestamp.toI32())

    const withdrawalRequest = new WithdrawalRequest(wrId.toString())
    withdrawalRequest.isWithdrawn = true
    withdrawalRequest.save()
}

export function logDeposited(event: LogDeposited): void {
    const params = event.params
    const userAddress = params.user
    const ftmAmount = params.amount
    const sftmxAmount = params.ftmxAmount

    const user = getOrCreateUser(userAddress)

    const depositId = userAddress.concatI32(event.block.timestamp.toI32())
    const deposit = new Deposit(depositId)
    deposit.user = user.id
    deposit.ftmAmount = scaleDown(ftmAmount, 18)
    deposit.sftmxAmount = scaleDown(sftmxAmount, 18)
    deposit.timestamp = event.block.timestamp.toI32()
    deposit.save()

    user.save()

    takeSnapshot(event.block.timestamp.toI32())
}

export function logVaultHarvested(event: LogVaultHarvested): void {
    const vaultAddress = event.params.vault
    const vault = Vault.load(vaultAddress)
    if (vault !== null) {
        vault.isHarvested = true
        vault.save()
    } else {
        log.critical(`Harvest event on vault that was not created {}`, [vaultAddress.toString()])
    }

    takeSnapshot(event.block.timestamp.toI32())
}

export function logVaultWithdrawn(event: LogVaultWithdrawn): void {
    const vaultAddress = event.params.vault
    const vault = Vault.load(vaultAddress)
    if (vault !== null) {
        vault.isWithdrawn = true
        vault.save()
    } else {
        log.critical(`Withdrawal event on vault that was not created {}`, [vaultAddress.toString()])
    }

    takeSnapshot(event.block.timestamp.toI32())
}

export function logUndelegatePausedUpdated(event: LogUndelegatePausedUpdated): void {
    const ftmStaking = getOrCreateFtmStaking()
    ftmStaking.undelegatePaused = event.params.newValue
    ftmStaking.save()
}

export function logWithdrawPausedUpdated(event: LogWithdrawPausedUpdated): void {
    const ftmStaking = getOrCreateFtmStaking()
    ftmStaking.withdrawPaused = event.params.newValue
    ftmStaking.save()
}

export function logMaintenancePausedUpdated(event: LogMaintenancePausedUpdated): void {
    const ftmStaking = getOrCreateFtmStaking()
    ftmStaking.maintenancePaused = event.params.newValue
    ftmStaking.save()
}

export function logDepositLimitUpdated(event: LogDepositLimitUpdated): void {
    const ftmStaking = getOrCreateFtmStaking()
    ftmStaking.minDepositLimit = event.params.low
    ftmStaking.maxDepositLimit = event.params.high
    ftmStaking.save()
}

function takeSnapshot(timestamp: i32): void {
    const stakingSnapshot = getOrCreateFtmStakingSnapshot(timestamp)

    const stakingContract = StakingContract.bind(dataSource.address())
    const ftmPoolBalance = stakingContract.getPoolBalance()
    const totalFtm = stakingContract.totalFTMWorth()
    const lockedFtm = totalFtm.minus(ftmPoolBalance)
    const exchangeRate = stakingContract.getExchangeRate()

    stakingSnapshot.freePoolFtmAmount = scaleDown(ftmPoolBalance, 18)
    stakingSnapshot.lockedFtmAmount = scaleDown(lockedFtm, 18)
    stakingSnapshot.totalFtmAmount = scaleDown(totalFtm, 18)
    stakingSnapshot.exchangeRate = scaleDown(exchangeRate, 18)
    stakingSnapshot.save()
}
