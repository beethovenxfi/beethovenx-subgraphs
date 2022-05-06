import { MasterChef } from "../../generated/schema";
import { MasterChef as MasterChefContract } from "../../generated/MasterChef/MasterChef";
import { dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  BIG_INT_ZERO,
  MASTER_CHEF_INITIAL_BEETS_PER_BLOCK,
} from "../constants";
import { getToken } from "./token";

export function getMasterChef(block: ethereum.Block): MasterChef {
  let masterChef = MasterChef.load(dataSource.address());

  if (masterChef === null) {
    const chefContract = MasterChefContract.bind(dataSource.address());
    const token = getToken(chefContract.beets());
    masterChef = new MasterChef(dataSource.address());
    masterChef.totalAllocPoint = BIG_INT_ZERO;
    masterChef.emissionPerBlock = MASTER_CHEF_INITIAL_BEETS_PER_BLOCK;
    masterChef.poolCount = BIG_INT_ZERO;
    masterChef.emissionToken = token.id;
  }

  masterChef.timestamp = block.timestamp;
  masterChef.block = block.number;
  masterChef.save();

  return masterChef as MasterChef;
}
