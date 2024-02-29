import {
  stringToBytes,
  bytesToU256,
  bytesToString,
  boolToByte,
  byteToBool,
  u256ToBytes,
} from '@massalabs/as-types';
import {
  Storage,
  Context,
  createEvent,
  generateEvent,
} from '@massalabs/massa-as-sdk';

import { u256 } from 'as-bignum/assembly';

export const URI_KEY: StaticArray<u8> = [0x01];

export const BALANCE_KEY_PREFIX: StaticArray<u8> = [0x02];
export const OPERATOR_APPROVAL_KEY_PREFIX: StaticArray<u8> = [0x03];
export const ALLOWANCE_KEY_PREFIX: StaticArray<u8> = [0x04];

/**
 * Constructs a new Multi-NFT contract.
 * @param uri - the URI for the NFT contract
 *
 * @remarks This function shouldn't be directly exported by the implementation contract.
 * It is meant to be called by the constructor of the implementation contract.
 * Please check the token.ts file for an example of how to use this function.
 */
export function _constructor(uri: string): void {
  _setURI(uri);
}

/**
 * @param address - address to get the balance for
 * @returns the key of the balance in the storage for the given address
 */
function balanceKey(id: u256, address: string): StaticArray<u8> {
  return BALANCE_KEY_PREFIX.concat(
    u256ToBytes(id).concat(stringToBytes(address)),
  );
}

/**
 *
 * @param owner - the address of the owner
 * @param operator - the address of the operator
 * @returns The key of the operator allowance in the storage for the given owner and operator
 */
function operatorApprovalKey(owner: string, operator: string): StaticArray<u8> {
  return OPERATOR_APPROVAL_KEY_PREFIX.concat(
    stringToBytes(owner).concat(stringToBytes(operator)),
  );
}

/**
 * Count all NFTs assigned to an owner.
 *
 * @param owner - An address for whom to query the balance
 */
export function _balanceOf(owner: string, id: u256): u256 {
  const key = balanceKey(id, owner);
  return Storage.has(key) ? bytesToU256(Storage.get(key)) : u256.Zero;
}

export function _balanceOfBatch(owners: string[], ids: u256[]): u256[] {
  const balances = new Array<u256>(owners.length);
  for (let i = 0; i < owners.length; i++) {
    balances[i] = _balanceOf(owners[i], ids[i]);
  }
  return balances;
}

/**
 * Returns the URI for a given token ID.
 *
 * @param _ - The token ID
 * @returns the URI for the given token ID or an empty string if the URI is not set.
 */
export function _uri(_: u256): string {
  return Storage.has(URI_KEY) ? bytesToString(Storage.get(URI_KEY)) : '';
}

export function _setURI(newUri: string): void {
  Storage.set(URI_KEY, stringToBytes(newUri));
}

/**
 * Change ,reaffirm or revoke the approved address for an NFT.
 * Checks that the caller is the NFT owner or has been approved by the owner.
 *
 * @param id - The NFT to approve
 * @param approved - The new approved NFT operator
 *
 * @remarks If approved is the zero address, the function will clear the approval for the NFT by deleting the key.
 *
 */
export function _setApprovalForAll(
  owner: string,
  operator: string,
  approved: bool,
): void {
  assert(operator == '', 'Invalid operator');

  const key = operatorApprovalKey(owner, operator);
  approved ? Storage.set(key, boolToByte(true)) : Storage.del(key);

  generateEvent(
    createEvent('ApprovalForAll', [owner, operator, approved.toString()]),
  );
}

/**
 * Query if an address is an authorized operator for another address
 * @param owner - The address that owns the NFTs
 * @param operator - The address that acts on behalf of the owner
 * @returns true if the operator is approved for all, false if not
 */
export function _isApprovedForAll(owner: string, operator: string): bool {
  const key = operatorApprovalKey(owner, operator);
  return Storage.has(key) ? byteToBool(Storage.get(key)) : false;
}

/**
 * Transfers `id` from its current owner to `to`,
 * or alternatively mints if the current owner is the zero address.
 * or alternatively burns if the `to` is the zero address.
 *
 * @param to - the address to transfer the token to. If the address is the zero address, the token is burned.
 * @param id - the token to transfer. If the owner is the zero address, i.e., the token isn't owned,
 * the token gets minted.
 * @param auth - the address of the operator. If the 'auth' is non 0,
 * then this function will check that 'auth' is either the owner of the token,
 * or approved to operate on the token (by the owner). If `auth` is 0, then no check is performed.
 *
 * @remarks This function is a helper function for functions such as `transfer`, `transferFrom`, `mint` or `burn`.
 * It is not meant to be called directly as it does not check for the caller's permissions.
 * For example if you were to wrap this helper in a `transfer` function,
 * you should check that the caller is the owner of the token, and then call the _update function.
 */

export function _update(
  from: string,
  to: string,
  ids: u256[],
  values: u256[],
): void {
  assert(ids.length == values.length, 'ERC1155InvalidArrayLength');

  const operator = Context.caller().toString();

  for (let i = 0; i < ids.length; ++i) {
    const id = ids[i];
    const value = values[i];

    if (from != '') {
      const fromBalanceKey = balanceKey(id, from);
      const fromBalance = Storage.has(fromBalanceKey)
        ? bytesToU256(Storage.get(fromBalanceKey))
        : u256.Zero;
      assert(fromBalance >= value, 'ERC1155InsufficientBalance');
      Storage.set(fromBalanceKey, u256ToBytes(fromBalance - value));
    }

    if (to != '') {
      const toBalanceKey = balanceKey(id, to);
      const toBalance = Storage.has(toBalanceKey)
        ? bytesToU256(Storage.get(toBalanceKey))
        : u256.Zero;

      Storage.set(toBalanceKey, u256ToBytes(toBalance + value));
    }
  }

  if (ids.length == 1) {
    generateEvent(
      createEvent('TransferSingle', [
        operator,
        from,
        to,
        ids[0].toString(),
        values[0].toString(),
      ]),
    );
  } else {
    generateEvent(
      createEvent('TransferBatch', [
        operator,
        from,
        to,
        ids.map<string>((id: u256) => id.toString()).join(';'),
        values.map<string>((value: u256) => value.toString()).join(';'),
      ]),
    );
  }
}

export function _transferFrom(
  from: string,
  to: string,
  id: u256,
  value: u256,
): void {
  assert(to != '', 'ERC1155InvalidReceiver');
  assert(from != '', 'ERC1155InvalidSender');

  _update(from, to, [id], [value]);
}

export function _batchTransferFrom(
  from: string,
  to: string,
  ids: u256[],
  values: u256[],
): void {
  assert(to != '', 'ERC1155InvalidReceiver');
  assert(from != '', 'ERC1155InvalidSender');

  _update(from, to, ids, values);
}

export function _mint(to: string, id: u256, value: u256): void {
  assert(to != '', 'ERC1155InvalidReceiver');

  _update('', to, [id], [value]);
}

export function _mintBatch(to: string, ids: u256[], values: u256[]): void {
  assert(to != '', 'ERC1155InvalidReceiver');

  _update('', to, ids, values);
}

export function _burn(from: string, id: u256, value: u256): void {
  assert(from != '', 'ERC1155InvalidSender');

  _update(from, '', [id], [value]);
}

export function _burnBatch(
  from: string,
  ids: u256[],
  values: u256[],
): void {
  assert(from != '', 'ERC1155InvalidSender');

  _update(from, '', ids, values);
}

/**
 TOD0: Implement the safeTransferFrom function.
 To do so you need to verify that the recipient is a contract and supports the ERC1155Receiver interface.
*/
