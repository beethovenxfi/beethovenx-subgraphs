import { Address } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { ERC20 } from "../../generated/MasterChef/ERC20";

export function getToken(address: Address): Token {
  let token = Token.load(address);

  if (token === null) {
    const erc20 = ERC20.bind(address);
    token = new Token(address);
    token.address = address;
    token.decimals = erc20.decimals();
    token.symbol = erc20.symbol();
    token.name = erc20.name();
    token.save();
  }

  return token;
}
