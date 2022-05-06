import { dataSource, ethereum } from "@graphprotocol/graph-ts/index";
import { Bar as BarContract } from "../../generated/BeetsBar/Bar";
import { BIG_DECIMAL_ZERO } from "../constants";
import { getToken } from "./token";
import { GovernanceShare } from "../../generated/schema";

export function getGovernanceShare(block: ethereum.Block): GovernanceShare {
  let governanceShare = GovernanceShare.load(dataSource.address());

  if (governanceShare === null) {
    const contract: BarContract = BarContract.bind(dataSource.address());
    const token = getToken(dataSource.address());
    const vestingToken = getToken(contract.vestingToken());
    governanceShare = new GovernanceShare(dataSource.address());
    governanceShare.underlyingToken = token.id;
    governanceShare.underlyingTokenAddress = token.address;
    governanceShare.vestingToken = governanceShare.vestingToken =
      vestingToken.id;
    governanceShare.vestingTokenAddress = vestingToken.address;
    governanceShare.totalSupply = BIG_DECIMAL_ZERO;
    governanceShare.ratio = BIG_DECIMAL_ZERO;
    governanceShare.sharesMinted = BIG_DECIMAL_ZERO;
    governanceShare.sharesBurned = BIG_DECIMAL_ZERO;
    governanceShare.vestingTokenBalance = BIG_DECIMAL_ZERO;
    governanceShare.sharedVestingTokenRevenue = BIG_DECIMAL_ZERO;
  }
  governanceShare.block = block.number;
  governanceShare.timestamp = block.timestamp;
  governanceShare.save();

  return governanceShare;
}
