import { Address, dataSource, BigInt, BigDecimal, Bytes } from '@graphprotocol/graph-ts'
import { FtmStaking, FtmStakingSnapshot, User } from '../../generated/schema'

const DAY = 24 * 60 * 60

export function getOrCreateFtmStaking(): FtmStaking {
    const address = dataSource.address()
    let ftmStaking = FtmStaking.load(address)

    if (ftmStaking === null) {
        ftmStaking = new FtmStaking(address)
        ftmStaking.undelegatePaused = false
        ftmStaking.withdrawPaused = false
        ftmStaking.maintenancePaused = false
        ftmStaking.minDepositLimit = BigInt.fromString('0')
        ftmStaking.maxDepositLimit = BigInt.fromString('100000000000000000000')
        ftmStaking.save()
    }
    return ftmStaking
}

export function getOrCreateUser(id: Address): User {
    let user = User.load(id)
    if (user === null) {
        user = new User(id)
        user.sftmxBalance = BigDecimal.zero()
        user.ftmStaking = getOrCreateFtmStaking().id
        user.save()
    }
    return user
}

export function getOrCreateFtmStakingSnapshot(timestamp: i32): FtmStakingSnapshot {
    let timestampStartOfDay = timestamp - (timestamp % DAY)
    const snpashotId = dataSource.address().concatI32(timestampStartOfDay)
    let snapshot = FtmStakingSnapshot.load(snpashotId)

    if (snapshot === null) {
        snapshot = new FtmStakingSnapshot(snpashotId)
        snapshot.snapshotTimestamp = timestampStartOfDay
        snapshot.freePoolFtmAmount = BigDecimal.zero()
        snapshot.lockedFtmAmount = BigDecimal.zero()
        snapshot.totalFtmAmount = BigDecimal.zero()
        snapshot.exchangeRate = BigDecimal.zero()
        snapshot.save()
    }
    return snapshot
}
