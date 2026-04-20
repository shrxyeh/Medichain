import Web3 from "web3";

/**
 * Hash a password before sending it to the smart contract.
 * The contract stores and compares hashed values only —
 * the plaintext password never leaves the browser.
 */
export function hashPassword(plaintext) {
  return Web3.utils.sha3(plaintext);
}
