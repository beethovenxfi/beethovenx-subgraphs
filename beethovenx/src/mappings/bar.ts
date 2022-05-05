import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
} from "../constants";
import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import {
  Bar as BarContract,
  Enter,
  Leave,
  ShareRevenue,
  Transfer as TransferEvent,
} from "../../generated/BeetsBar/Bar";
import { ERC20 } from "../../generated/BeetsBar/ERC20";
import { getGovernanceToken } from "../entities/bar";
import { getUserGovernanceTokenBalance } from "../entities/user-governance-token-balance";

export function enter(event: Enter): void {
  log.warning("Enter - get bar", []);
  const governanceToken = getGovernanceToken(event.block);
  const barContract = BarContract.bind(dataSource.address());
  const userTokenBalance = getUserGovernanceTokenBalance(
    event.params.user,
    event.block
  );

  const mintAmountDecimal =
    event.params.mintedAmount.divDecimal(BIG_DECIMAL_1E18);
  userTokenBalance.balance = userTokenBalance.balance.plus(mintAmountDecimal);

  userTokenBalance.save();

  governanceToken.totalSupply = barContract
    .totalSupply()
    .divDecimal(BIG_DECIMAL_1E18);

  governanceToken.vestingTokenBalance = ERC20.bind(
    changetype<Address>(governanceToken.vestingToken)
  )
    .balanceOf(dataSource.address())
    .divDecimal(BIG_DECIMAL_1E18);

  governanceToken.ratio = governanceToken.vestingTokenBalance.div(
    governanceToken.totalSupply
  );
  governanceToken.sharesMinted =
    governanceToken.sharesMinted.plus(mintAmountDecimal);
  governanceToken.save();
}

export function leave(event: Leave): void {
  const governanceToken = getGovernanceToken(event.block);
  const barContract = BarContract.bind(dataSource.address());
  const userTokenBalance = getUserGovernanceTokenBalance(
    event.params.user,
    event.block
  );

  const burnedAmount = event.params.burnedAmount.divDecimal(BIG_DECIMAL_1E18);

  userTokenBalance.balance = userTokenBalance.balance.minus(burnedAmount);
  userTokenBalance.save();

  governanceToken.totalSupply = barContract
    .totalSupply()
    .divDecimal(BIG_DECIMAL_1E18);
  governanceToken.vestingTokenBalance = ERC20.bind(
    changetype<Address>(governanceToken.vestingToken)
  )
    .balanceOf(dataSource.address())
    .divDecimal(BIG_DECIMAL_1E18);

  if (governanceToken.totalSupply.equals(BIG_DECIMAL_ZERO)) {
    governanceToken.ratio = BIG_DECIMAL_ONE;
  } else {
    governanceToken.ratio = governanceToken.vestingTokenBalance.div(
      governanceToken.totalSupply
    );
  }
  governanceToken.sharesBurned =
    governanceToken.sharesBurned.plus(burnedAmount);
  governanceToken.save();
}

export function shareRevenue(event: ShareRevenue): void {
  const governanceToken = getGovernanceToken(event.block);

  const sharedRevenueAmount = event.params.amount.divDecimal(BIG_DECIMAL_1E18);

  governanceToken.vestingTokenBalance = ERC20.bind(
    changetype<Address>(governanceToken.vestingToken)
  )
    .balanceOf(dataSource.address())
    .divDecimal(BIG_DECIMAL_1E18);

  governanceToken.ratio = governanceToken.vestingTokenBalance.div(
    governanceToken.totalSupply
  );
  governanceToken.sharedVestingTokenRevenue =
    governanceToken.sharedVestingTokenRevenue.plus(sharedRevenueAmount);
  governanceToken.save();
}

export function transfer(event: TransferEvent): void {
  const transferAmount = event.params.value.divDecimal(BIG_DECIMAL_1E18);

  // only handle user to user transfers
  if (
    transferAmount.equals(BIG_DECIMAL_ZERO) ||
    event.params.from === ADDRESS_ZERO ||
    event.params.to === ADDRESS_ZERO
  ) {
    return;
  }

  // If transfer from address to address and not known fBeets pools.
  if (event.params.from != ADDRESS_ZERO && event.params.to != ADDRESS_ZERO) {
    log.info("transfered {} fBeets from {} to {}", [
      transferAmount.toString(),
      event.params.from.toHex(),
      event.params.to.toHex(),
    ]);

    const fromUser = getUserGovernanceTokenBalance(
      event.params.from,
      event.block
    );
    fromUser.balance = fromUser.balance.minus(transferAmount);
    fromUser.save();

    const toUser = getUserGovernanceTokenBalance(event.params.to, event.block);
    toUser.balance = toUser.balance.plus(transferAmount);
    toUser.save();
  }
}
