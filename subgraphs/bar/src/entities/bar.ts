import { dataSource, ethereum } from "@graphprotocol/graph-ts/index";
import { Bar } from "../../generated/schema";
import { Bar as BarContract } from "../../generated/BeetsBar/Bar";
import { BIG_DECIMAL_ZERO } from "../../../../packages/constants";

export function getBar(block: ethereum.Block): Bar {
  let bar = Bar.load(dataSource.address().toHex());

  if (bar === null) {
    const contract: BarContract = BarContract.bind(dataSource.address());
    bar = new Bar(dataSource.address().toHex());
    bar.address = dataSource.address();
    bar.totalSupply = BIG_DECIMAL_ZERO;
    bar.vestingTokenStaked = BIG_DECIMAL_ZERO;
    bar.sharedVestingTokenRevenue = BIG_DECIMAL_ZERO;
    bar.fBeetsMinted = BIG_DECIMAL_ZERO;
    bar.fBeetsBurned = BIG_DECIMAL_ZERO;
    bar.ratio = BIG_DECIMAL_ZERO;
    bar.vestingToken = contract.vestingToken();
    bar.decimals = contract.decimals();
    bar.name = contract.name();
    bar.symbol = contract.symbol();
  }
  bar.block = block.number;
  bar.timestamp = block.timestamp;
  bar.save();

  return bar as Bar;
}
