import {
  PoolBalanceChanged,
  PoolBalanceManaged,
  Swap,
} from "../../generated/Vault/Vault";
import { Bytes, ethereum } from "@graphprotocol/graph-ts/index";
import { PoolChangeEvent } from "../../generated/schema";

const ENTITY_TYPE = "BALANCER_POOL";

export function swap(event: Swap): void {
  createChangeEvent(event, ENTITY_TYPE, "SWAP", event.params.poolId);
}
export function balanceChanged(event: PoolBalanceChanged): void {
  createChangeEvent(event, ENTITY_TYPE, "BALANCE_CHANGED", event.params.poolId);
}

export function balanceManaged(event: PoolBalanceManaged): void {
  createChangeEvent(event, ENTITY_TYPE, "BALANCE_MANAGED", event.params.poolId);
}

export function createChangeEvent(
  event: ethereum.Event,
  entityType: string,
  action: string,
  poolId: Bytes
): void {
  const entityChangeEvent = new PoolChangeEvent(
    event.transaction.hash.concat(poolId)
  );
  entityChangeEvent.poolId = poolId;
  entityChangeEvent.action = action;
  entityChangeEvent.block = event.block.number;
  entityChangeEvent.timestamp = event.block.timestamp;
  entityChangeEvent.save();
}
