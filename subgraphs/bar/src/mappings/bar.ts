import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
} from "const";
import { Address, log } from "@graphprotocol/graph-ts";
import {
  Bar as BarContract,
  Enter,
  Leave,
  ShareRevenue,
  Transfer as TransferEvent,
} from "../../generated/BeetsBar/Bar";
import { getBar, getUser } from "../entities";
import { ERC20 } from "../../generated/BeetsBar/ERC20";

export function enter(event: Enter): void {
  const bar = getBar(event.block);
  const barContract = BarContract.bind(bar.address as Address);
  const user = getUser(event.params.user, event.block);

  const vestingInAmount =
    event.params.vestingInAmount.divDecimal(BIG_DECIMAL_1E18);
  const mintAmount = event.params.mintedAmount.divDecimal(BIG_DECIMAL_1E18);

  user.vestingTokenIn = user.vestingTokenIn.plus(vestingInAmount);
  user.fBeets = user.fBeets.plus(mintAmount);
  user.save();

  bar.totalSupply = barContract.totalSupply().divDecimal(BIG_DECIMAL_1E18);
  bar.vestingTokenStaked = ERC20.bind(bar.vestingToken as Address)
    .balanceOf(bar.address as Address)
    .divDecimal(BIG_DECIMAL_1E18);
  bar.ratio = bar.vestingTokenStaked.div(bar.totalSupply);
  bar.fBeetsMinted = bar.fBeetsMinted.plus(mintAmount);
  bar.save();
}

export function leave(event: Leave): void {
  const bar = getBar(event.block);
  const user = getUser(event.params.user, event.block);

  const barContract = BarContract.bind(bar.address as Address);

  const vestingOutAmount =
    event.params.vestingOutAmount.divDecimal(BIG_DECIMAL_1E18);
  const burnedAmount = event.params.burnedAmount.divDecimal(BIG_DECIMAL_1E18);

  user.vestingTokenOut = user.vestingTokenOut.plus(vestingOutAmount);
  user.vestingTokenHarvested =
    user.vestingTokenHarvested.plus(vestingOutAmount);
  user.fBeets = user.fBeets.minus(burnedAmount);
  user.save();

  bar.totalSupply = barContract.totalSupply().divDecimal(BIG_DECIMAL_1E18);
  bar.vestingTokenStaked = ERC20.bind(bar.vestingToken as Address)
    .balanceOf(bar.address as Address)
    .divDecimal(BIG_DECIMAL_1E18);
  if (bar.totalSupply.equals(BIG_DECIMAL_ZERO)) {
    bar.ratio = BIG_DECIMAL_ONE;
  } else {
    bar.ratio = bar.vestingTokenStaked.div(bar.totalSupply);
  }
  bar.fBeetsBurned = bar.fBeetsBurned.plus(burnedAmount);
  bar.save();
}

export function shareRevenue(event: ShareRevenue): void {
  const bar = getBar(event.block);

  const sharedRevenueAmount = event.params.amount.divDecimal(BIG_DECIMAL_1E18);

  bar.vestingTokenStaked = ERC20.bind(bar.vestingToken as Address)
    .balanceOf(bar.address as Address)
    .divDecimal(BIG_DECIMAL_1E18);
  bar.ratio = bar.vestingTokenStaked.div(bar.totalSupply);
  bar.sharedVestingTokenRevenue =
    bar.sharedVestingTokenRevenue.plus(sharedRevenueAmount);
  bar.save();
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
    const bar = getBar(event.block);
    const what = transferAmount.times(bar.ratio);
    log.info("transfered {} fBeets from {} to {}", [
      transferAmount.toString(),
      event.params.from.toHex(),
      event.params.to.toHex(),
    ]);

    const fromUser = getUser(event.params.from, event.block);

    fromUser.fBeets = fromUser.fBeets.minus(transferAmount);
    fromUser.vestingTokenOut = fromUser.vestingTokenOut.plus(what);

    fromUser.save();

    const toUser = getUser(event.params.to, event.block);

    toUser.fBeets = toUser.fBeets.plus(transferAmount);
    toUser.vestingTokenIn = toUser.vestingTokenIn.plus(what);

    toUser.save();
  }
}
