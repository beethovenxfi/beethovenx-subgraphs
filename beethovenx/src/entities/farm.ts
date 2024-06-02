import { BigInt, Bytes, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { ADDRESS_ZERO, BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";
import { Farm } from "../../generated/schema";

export function getFarm(farmId: BigInt, block: ethereum.Block): Farm {
  const id = Bytes.fromI32(farmId.toI32());
  let farm = Farm.load(id);

  if (farm === null) {
    farm = new Farm(id);
    farm.farmId = farmId;
    farm.masterChef = dataSource.address();
    farm.balance = BIG_DECIMAL_ZERO;
    farm.allocPoint = BIG_INT_ZERO;
    farm.userCount = BIG_INT_ZERO;
    farm.token = ADDRESS_ZERO;
    farm.tokenAddress = ADDRESS_ZERO;
  }

  farm.timestamp = block.timestamp;
  farm.block = block.number;
  farm.save();

  return farm as Farm;
}
