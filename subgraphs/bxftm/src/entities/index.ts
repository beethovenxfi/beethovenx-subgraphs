import { Address, dataSource, BigInt } from '@graphprotocol/graph-ts'
import { FtmStaking, User } from '../../generated/schema'

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
        user.ftmStaking = getOrCreateFtmStaking().id
        user.save()
    }
    return user
}
