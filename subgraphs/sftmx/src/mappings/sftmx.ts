import { Address } from '@graphprotocol/graph-ts'
import { Transfer } from '../../generated/sFTMx/ERC20'
import { getOrCreateUser } from '../entities'
import { scaleDown } from '../utils/numbers'

export function logTransfer(event: Transfer): void {
    if (event.params.from == Address.zero()) {
        // mint
        const userTo = getOrCreateUser(event.params.to)
        userTo.sftmxBalance = userTo.sftmxBalance.plus(scaleDown(event.params.value, 18))
        userTo.save()
    } else if (event.params.to == Address.zero()) {
        // burn
        const userFrom = getOrCreateUser(event.params.to)
        userFrom.sftmxBalance = userFrom.sftmxBalance.minus(scaleDown(event.params.value, 18))
        userFrom.save()
    } else {
        // account transfer
        const userTo = getOrCreateUser(event.params.to)
        userTo.sftmxBalance = userTo.sftmxBalance.plus(scaleDown(event.params.value, 18))
        userTo.save()

        const userFrom = getOrCreateUser(event.params.to)
        userFrom.sftmxBalance = userFrom.sftmxBalance.minus(scaleDown(event.params.value, 18))
        userFrom.save()
    }
}
