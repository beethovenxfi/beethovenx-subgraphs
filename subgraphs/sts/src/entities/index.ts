import { dataSource, BigDecimal } from '@graphprotocol/graph-ts'
import { SonicStaking, SonicStakingSnapshot, Validator } from '../../generated/schema'

const DAY = 24 * 60 * 60

export function getOrCreateSonicStaking(): SonicStaking {
    const address = dataSource.address()
    let sonicStaking = SonicStaking.load(address)

    if (sonicStaking === null) {
        sonicStaking = new SonicStaking(address)
        sonicStaking.totalPool = BigDecimal.zero()
        sonicStaking.totalAssets = BigDecimal.zero()
        sonicStaking.totalDelegated = BigDecimal.zero()
        sonicStaking.exchangeRate = BigDecimal.zero()
        sonicStaking.save()
    }
    return sonicStaking
}

export function getOrCreateValidator(id: string): Validator {
    let validator = Validator.load(id)

    if (validator === null) {
        let sonicStaking = getOrCreateSonicStaking()

        validator = new Validator(id)
        validator.amountAssetsDelegated = BigDecimal.zero()
        validator.sonicStaking = sonicStaking.id
        validator.save()
    }

    return validator
}

export function getOrCreateSonicStakingSnapshot(timestamp: i32): SonicStakingSnapshot {
    let timestampStartOfDay = timestamp - (timestamp % DAY)
    const snpashotId = dataSource.address().concatI32(timestampStartOfDay)
    let snapshot = SonicStakingSnapshot.load(snpashotId)

    if (snapshot === null) {
        snapshot = new SonicStakingSnapshot(snpashotId)
        snapshot.snapshotTimestamp = timestampStartOfDay
        snapshot.totalPool = BigDecimal.zero()
        snapshot.totalAssets = BigDecimal.zero()
        snapshot.totalDelegated = BigDecimal.zero()
        snapshot.exchangeRate = BigDecimal.zero()
        snapshot.save()
    }
    return snapshot
}
