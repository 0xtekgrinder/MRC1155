import { onlyOwner } from '../utils/ownership';
import { _mint } from '../token-internal';
import { Args } from '@massalabs/as-types';

/**
 * Mintable feature for fungible token.
 *
 * Re-export this file in your contract entry file to make it available in the contract.
 *
 * Token mint is restricted to the owner of the contract.
 *
 */

/**
 *  Mint tokens on the recipient address.
 *  Restricted to the owner of the contract.
 *
 * @param binaryArgs - `Args` serialized StaticArray<u8> containing:
 * - the recipient's account (address)
 * - the amount of tokens to mint (u256).
 */
export function mint(binaryArgs: StaticArray<u8>): void {
  onlyOwner();
  const args = new Args(binaryArgs);
    const to = args
    .nextString()
    .expect('to argument is missing or invalid');
    const id = args.nextU256().expect('id argument is missing or invalid');
    const value = args.nextU256().expect('value argument is missing or invalid');
    
    _mint(to, id, value);
}
