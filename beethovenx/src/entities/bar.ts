import { dataSource, ethereum } from "@graphprotocol/graph-ts/index";
import { Bar as BarContract } from "../../generated/BeetsBar/Bar";
import { BIG_DECIMAL_ZERO } from "../constants";
import { log } from "@graphprotocol/graph-ts";
import { GovernanceToken } from "../../generated/schema";

export function getGovernanceToken(block: ethereum.Block): GovernanceToken {
  let governanceToken = GovernanceToken.load(dataSource.address());

  if (governanceToken === null) {
    const contract: BarContract = BarContract.bind(dataSource.address());
    governanceToken = new GovernanceToken(dataSource.address());
    governanceToken.address = dataSource.address();
    governanceToken.name = contract.name();
    governanceToken.symbol = contract.symbol();
    governanceToken.decimals = contract.decimals();
    governanceToken.vestingToken = contract.vestingToken();
    governanceToken.totalSupply = BIG_DECIMAL_ZERO;
    governanceToken.ratio = BIG_DECIMAL_ZERO;
    governanceToken.sharesMinted = BIG_DECIMAL_ZERO;
    governanceToken.sharesBurned = BIG_DECIMAL_ZERO;
    governanceToken.vestingTokenBalance = BIG_DECIMAL_ZERO;
    governanceToken.sharedVestingTokenRevenue = BIG_DECIMAL_ZERO;
  }
  governanceToken.block = block.number;
  governanceToken.timestamp = block.timestamp;
  governanceToken.save();

  return governanceToken;
}
