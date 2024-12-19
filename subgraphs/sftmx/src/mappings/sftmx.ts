import { Address, log } from '@graphprotocol/graph-ts'
import { Transfer } from '../../generated/sFTMx/ERC20'
import { getOrCreateUser } from '../entities'
import { scaleDown } from '../utils/numbers'

export function logTransfer(event: Transfer): void {
    if (event.params.from === Address.zero()) {
        // mint
        log.info('[sFTMx:Transfer] mint to {}', [event.params.to.toHex()])
        const userTo = getOrCreateUser(event.params.to)
        userTo.sftmxBalance = userTo.sftmxBalance.plus(scaleDown(event.params.value, 18))
        userTo.save()
    } else if (event.params.to === Address.zero()) {
        // burn
        log.info('[sFTMx:Transfer] burn from {}', [event.params.from.toHex()])
        const userFrom = getOrCreateUser(event.params.from)
        userFrom.sftmxBalance = userFrom.sftmxBalance.minus(scaleDown(event.params.value, 18))
        userFrom.save()
    } else {
        log.info('[sFTMx:Transfer] transfer from {} to {}', [event.params.from.toHex(), event.params.to.toHex()])
        // account transfer
        const userTo = getOrCreateUser(event.params.to)
        userTo.sftmxBalance = userTo.sftmxBalance.plus(scaleDown(event.params.value, 18))
        userTo.save()

        const userFrom = getOrCreateUser(event.params.from)
        userFrom.sftmxBalance = userFrom.sftmxBalance.minus(scaleDown(event.params.value, 18))
        userFrom.save()
    }
}
