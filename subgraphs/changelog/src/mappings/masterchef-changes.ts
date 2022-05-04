import {
  Deposit,
  EmergencyWithdraw,
  Withdraw,
} from "../../generated/MasterChef/MasterChef";
import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { FarmChangeEvent } from "../../generated/schema";

const ENTITY_TYPE: string = "FARM";

export function deposit(event: Deposit): void {
  createChangeEvent(event, ENTITY_TYPE, "DEPOSIT", event.params.pid.toI32());
}

export function withdraw(event: Withdraw): void {
  createChangeEvent(event, ENTITY_TYPE, "WITHDRAW", event.params.pid.toI32());
}

export function emergencyWithdraw(event: EmergencyWithdraw): void {
  createChangeEvent(event, ENTITY_TYPE, "WITHDRAW", event.params.pid.toI32());
}
function createChangeEvent(
  event: ethereum.Event,
  entityType: string,
  action: string,
  farmId: i32
): void {
  const entityChangeEvent = new FarmChangeEvent(
    event.transaction.hash.concatI32(farmId)
  );
  entityChangeEvent.farmId = farmId;
  entityChangeEvent.action = action;
  entityChangeEvent.block = event.block.number;
  entityChangeEvent.timestamp = event.block.timestamp;
  entityChangeEvent.save();
}
