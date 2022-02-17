import { User } from "../../generated/schema";
import { Address, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { BIG_DECIMAL_ZERO } from "const";

export function getUser(address: Address, block: ethereum.Block): User {
  const uid = address.toHex();
  let user = User.load(uid);

  if (user === null) {
    user = new User(uid);
    user.address = address;
    user.bar = dataSource.address().toHex();
    user.fBeets = BIG_DECIMAL_ZERO;
    user.vestingTokenIn = BIG_DECIMAL_ZERO;
    user.vestingTokenOut = BIG_DECIMAL_ZERO;
    user.vestingTokenHarvested = BIG_DECIMAL_ZERO;
  }

  user.block = block.number;
  user.timestamp = block.timestamp;

  user.save();

  return user as User;
}
