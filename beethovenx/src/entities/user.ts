import { Address } from "@graphprotocol/graph-ts";
import { User } from "../../generated/schema";

export function getUser(address: Address): User {
  let user = User.load(address);

  if (user === null) {
    user = new User(address);
    user.address = address;
  }
  user.save();

  return user as User;
}
