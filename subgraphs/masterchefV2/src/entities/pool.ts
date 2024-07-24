import { Pool } from '../../generated/schema'
import { BigInt, ethereum } from '@graphprotocol/graph-ts'
import { getMasterChef } from './masterchef'
import { ADDRESS_ZERO, BIG_INT_ZERO } from '../constants'

export function getPool(pid: BigInt, block: ethereum.Block): Pool {
    const masterChef = getMasterChef(block)

    let pool = Pool.load(pid.toString())

    if (pool === null) {
        pool = new Pool(pid.toString())
        pool.masterChef = masterChef.id
        pool.pair = ADDRESS_ZERO
        pool.allocPoint = BIG_INT_ZERO
        pool.lastRewardBlock = BIG_INT_ZERO
        pool.accBeetsPerShare = BIG_INT_ZERO
        pool.slpBalance = BIG_INT_ZERO
        pool.userCount = BIG_INT_ZERO
    }

    pool.timestamp = block.timestamp
    pool.block = block.number
    pool.save()

    return pool as Pool
}
