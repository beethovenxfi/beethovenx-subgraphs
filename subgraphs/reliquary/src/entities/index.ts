import { Address, BigDecimal, BigInt, Bytes, dataSource } from '@graphprotocol/graph-ts';
import {
    DailyPoolSnapshot,
    DailyRelicSnapshot,
    EmissionCurve,
    Harvest,
    Pool,
    PoolLevel,
    Relic,
    Reliquary,
    Rewarder,
    RewarderEmission,
    Token,
    User,
} from '../../generated/schema';
import { Reliquary as ReliquaryContract } from '../../generated/Reliquary/Reliquary';
import { Rewarder as RewarderContract } from '../../generated/Reliquary/Rewarder';
import { BeetsConstantEmissionCurve } from '../../generated/templates/EmissionCurve/BeetsConstantEmissionCurve';
import { EmissionCurve as EmissionCurveTemplate } from '../../generated/templates';
import { ERC20 } from '../../generated/Reliquary/ERC20';
import { scaleDown } from '../utils/numbers';

const DAY = 24 * 60 * 60;

export function getOrCreateReliquary(): Reliquary {
    const address = dataSource.address();
    let reliquary = Reliquary.load(address);

    if (reliquary === null) {
        const reliquaryContract = ReliquaryContract.bind(address);
        const rewardToken = getOrCreateToken(reliquaryContract.rewardToken());
        const emissionCurve = getOrCreateEmissionCurve(reliquaryContract.emissionCurve());
        reliquary = new Reliquary(address);
        reliquary.emissionToken = rewardToken.id;
        reliquary.emissionCurve = emissionCurve.id;
        reliquary.totalAllocPoint = 0;
        reliquary.poolCount = 0;
        reliquary.relicCount = 0;
        reliquary.save();
    }
    return reliquary;
}

export function getOrCreateEmissionCurve(address: Address): EmissionCurve {
    let emissionCurve = EmissionCurve.load(address);

    if (emissionCurve === null) {
        const emissionCurveContract = BeetsConstantEmissionCurve.bind(address);
        let rewardPerSecond = BigDecimal.zero();
        const rewardPerSecondResult = emissionCurveContract.try_rewardPerSecond();
        if (!rewardPerSecondResult.reverted) {
            rewardPerSecond = scaleDown(rewardPerSecondResult.value, 18);
        }
        emissionCurve = new EmissionCurve(address);
        emissionCurve.address = address;
        emissionCurve.rewardPerSecond = rewardPerSecond;
        emissionCurve.save();
        EmissionCurveTemplate.create(address);
    }

    return emissionCurve;
}

export function createPool(
    pid: i32,
    allocPoint: i32,
    poolTokenAddress: Address,
    rewarderAddress: Address,
    nftDescriptor: Address,
): Pool {
    const contract = ReliquaryContract.bind(dataSource.address());
    const poolInfo = contract.getPoolInfo(BigInt.fromI32(pid));
    const levelInfo = contract.getLevelInfo(BigInt.fromI32(pid));
    const allocPoints = levelInfo.allocPoint;
    const requiredMaturities = levelInfo.requiredMaturity;

    const reliquary = getOrCreateReliquary();
    const poolToken = getOrCreateToken(poolTokenAddress);

    const pool = new Pool(Bytes.fromI32(pid));
    pool.pid = pid;
    pool.name = poolInfo.name;
    pool.reliquary = reliquary.id;
    pool.nftDescriptor = nftDescriptor;
    pool.poolToken = poolToken.id;
    pool.poolTokenAddress = poolTokenAddress;
    pool.totalBalance = BigDecimal.zero();
    pool.relicCount = 0;
    pool.allocPoint = allocPoint;
    if (rewarderAddress != Address.zero()) {
        const rewarder = getOrCreateRewarder(pid, rewarderAddress);
        pool.rewarder = rewarder.id;
    }
    pool.save();

    for (let index: i32 = 0; index < allocPoints.length; index++) {
        const poolLevel = new PoolLevel(Bytes.fromI32(pid).concatI32(index));
        poolLevel.pool = pool.id;
        poolLevel.level = index;
        poolLevel.balance = BigDecimal.zero();
        poolLevel.allocationPoints = allocPoints[index].toI32();
        poolLevel.requiredMaturity = requiredMaturities[index].toI32();
        poolLevel.save();
    }

    reliquary.totalAllocPoint = reliquary.totalAllocPoint + pool.allocPoint;
    reliquary.poolCount = reliquary.poolCount + 1;
    reliquary.save();

    return pool;
}

export function getPoolOrThrow(pid: i32): Pool {
    const pool = Pool.load(Bytes.fromI32(pid));
    if (pool === null) {
        throw new Error('Pool does not exist - ' + pid.toString());
    }
    return pool;
}

export function getOrCreateRewarder(pid: i32, rewarderAddress: Address): Rewarder {
    const rewarderId = Bytes.fromI32(pid).concat(rewarderAddress);
    let rewarder = Rewarder.load(rewarderAddress);

    if (rewarder === null) {
        const contract = RewarderContract.bind(rewarderAddress);
        const rewardToken = getOrCreateToken(contract.rewardToken());
        // TODO: set correct emissions from contract
        rewarder = new Rewarder(rewarderId);
        rewarder.save();
        const emission = new RewarderEmission(rewarderId.concat(rewardToken.id));
        emission.rewardToken = rewardToken.id;
        emission.rewardTokenAddress = rewardToken.address;
        emission.rewardPerSecond = BigDecimal.zero();
        emission.rewarder = rewarder.id;
        emission.save();
    }
    return rewarder;
}

export function getOrCreateDailyPoolSnapshot(pid: i32, timestamp: i32): DailyPoolSnapshot {
    let timestampStartOfDay = timestamp - (timestamp % DAY);
    const snpashotId = Bytes.fromI32(pid).concatI32(timestampStartOfDay);
    let snapshot = DailyPoolSnapshot.load(snpashotId);

    if (snapshot === null) {
        const pool = getPoolOrThrow(pid);
        snapshot = new DailyPoolSnapshot(snpashotId);
        snapshot.snapshotTimestamp = timestampStartOfDay;
        snapshot.totalBalance = BigDecimal.zero();
        snapshot.dailyDeposited = BigDecimal.zero();
        snapshot.dailyWithdrawn = BigDecimal.zero();
        snapshot.relicCount = 0;
        snapshot.poolId = pid;
        snapshot.pool = pool.id;
        snapshot.save();
    }
    return snapshot;
}

export function createRelic(userAddress: Address, relicId: i32): Relic {
    const reliquaryContract = ReliquaryContract.bind(dataSource.address());
    const positionInfo = reliquaryContract.getPositionForId(BigInt.fromI32(relicId));
    const pool = getPoolOrThrow(positionInfo.poolId.toI32());
    const user = getOrCreateUser(userAddress);

    const poolLevel = getPoolLevelOrThrow(pool.pid, 0);
    const relic = new Relic(Bytes.fromI32(relicId));
    relic.relicId = relicId;
    relic.reliquary = dataSource.address();
    relic.pool = pool.id;
    relic.pid = pool.pid;
    relic.userAddress = userAddress;
    relic.user = user.id;
    relic.balance = BigDecimal.zero();
    relic.level = 0;
    relic.poolLevel = poolLevel.id;
    relic.entryTimestamp = positionInfo.entry.toI32();
    relic.save();

    return relic;
}

export function getPoolLevelOrThrow(poolId: i32, level: i32): PoolLevel {
    const id = Bytes.fromI32(poolId).concatI32(level);
    let poolLevel = PoolLevel.load(id);
    if (poolLevel === null) {
        throw new Error(`Pool level for pool ${poolId} and level ${level} not found`);
    }
    return poolLevel;
}

export function getRelicOrThrow(relicId: i32): Relic {
    const relic = Relic.load(Bytes.fromI32(relicId));
    if (relic === null) {
        throw new Error('Relic not found - ' + relicId.toString());
    }
    return relic;
}

export function getOrCreateUser(address: Address): User {
    let user = User.load(address);

    if (user === null) {
        user = new User(address);
        user.address = address;
        user.reliquary = dataSource.address();
        user.save();
    }
    return user;
}

export function getOrCreateToken(address: Address): Token {
    let token = Token.load(address);
    if (token === null) {
        const erc20 = ERC20.bind(address);
        token = new Token(address);
        token.address = address;
        token.name = erc20.name();
        token.symbol = erc20.symbol();
        token.decimals = erc20.decimals();
        token.save();
    }
    return token;
}

export function createHarvest(relicId: i32, amount: BigInt, timestamp: i32, to: Address): Harvest {
    const reliquary = getOrCreateReliquary();
    const token = getOrCreateToken(Address.fromBytes(reliquary.emissionToken));
    const relic = getRelicOrThrow(relicId);
    const user = getOrCreateUser(to);
    const harvest = new Harvest(Bytes.fromI32(relicId).concatI32(timestamp));

    harvest.amount = scaleDown(amount, token.decimals);
    harvest.token = token.id;
    harvest.timestamp = timestamp;
    harvest.reliquary = reliquary.id;
    harvest.relic = relic.id;
    harvest.user = user.id;
    harvest.save();
    return harvest;
}

export function getOrCreateDailyRelicSnapshot(relicId: i32, userAddress: Bytes, timestamp: i32): DailyRelicSnapshot {
    let timestampStartOfDay = timestamp - (timestamp % DAY);
    const snpashotId = relicId.toString().concat(timestampStartOfDay.toString());
    let snapshot = DailyRelicSnapshot.load(snpashotId);

    if (snapshot === null) {
        const user = getOrCreateUser(Address.fromBytes(userAddress));
        const relic = getRelicOrThrow(relicId);
        snapshot = new DailyRelicSnapshot(snpashotId);
        snapshot.snapshotTimestamp = timestampStartOfDay;
        snapshot.balance = BigDecimal.zero();
        snapshot.user = user.id;
        snapshot.userAddress = user.address;
        snapshot.relic = relic.id;
        snapshot.relicId = relic.relicId;
        snapshot.poolId = relic.pid;
        snapshot.pool = relic.pool;
        snapshot.entryTimestamp = relic.entryTimestamp;
        snapshot.level = relic.level;

        snapshot.save();
    }
    return snapshot;
}
