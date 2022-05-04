import { MasterChef } from "../../generated/schema";
import { MasterChefV2 } from "../../generated/MasterChefV2/MasterChefV2";
import { dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  BIG_INT_ZERO,
  MASTER_CHEF_INITIAL_BEETS_PER_BLOCK,
} from "../constants";

export function getMasterChef(block: ethereum.Block): MasterChef {
  let masterChef = MasterChef.load(dataSource.address().toHex());

  if (masterChef === null) {
    const chefContract = MasterChefV2.bind(dataSource.address());
    masterChef = new MasterChef(dataSource.address().toHex());
    masterChef.totalAllocPoint = BIG_INT_ZERO;
    masterChef.beetsPerBlock = MASTER_CHEF_INITIAL_BEETS_PER_BLOCK;
    masterChef.poolCount = BIG_INT_ZERO;
    masterChef.beets = chefContract.beets();
  }

  masterChef.timestamp = block.timestamp;
  masterChef.block = block.number;
  masterChef.save();

  return masterChef as MasterChef;
}
