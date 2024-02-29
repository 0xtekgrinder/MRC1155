/**
 *
 * This is an example of an NFT contract that uses the NFT-internals
 * helper functions to implement the ERC721 standard.
 *
 * This files does basically two things:
 * 1. It wraps the NFT-internals functions, manages the deserialize/serialize of the arguments and return values,
 *    and exposes them to the outside world.
 * 2. It implements some custom features that are not part of the ERC721 standard, like mint, burn or ownership.
 *
 * The NFT-internals functions are not supposed to be re-exported by this file.
 */

import {
  Args,
  boolToByte,
  u256ToBytes,
} from '@massalabs/as-types';
import {
  _balanceOf,
  _constructor,
  _balanceOfBatch,
  _uri,
  _setApprovalForAll,
  _isApprovedForAll,
  _safeTransferFrom,
  _batchSafeTransferFrom,
} from './token-internal';

import { Context, isDeployingContract } from '@massalabs/massa-as-sdk';

export function constructor(binaryArgs: StaticArray<u8>): void {
  assert(isDeployingContract());
  const args = new Args(binaryArgs);
  const uri = args.nextString().expect('uri argument is missing or invalid');
  _constructor(uri);
}

export function uri(binaryArgs: StaticArray<u8>): string {
  const args = new Args(binaryArgs);
  const id = args.nextU256().expect('id argument is missing or invalid');

  return _uri(id);
}

export function balanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const owner = args
    .nextString()
    .expect('owner argument is missing or invalid');
  const id = args.nextU256().expect('id argument is missing or invalid');

  return u256ToBytes(_balanceOf(owner, id));
}

export function balanceOfBatch(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const owners = args
    .nextStringArray()
    .expect('owners argument is missing or invalid');
  const ids = args.nextU256Array().expect('ids argument is missing or invalid');
  const balances = _balanceOfBatch(owners, ids);

  return balances
    .map((balance) => u256ToBytes(balance))
    .reduce<StaticArray<u8>>((acc, balance) => acc.concat(balance), []);
}

export function setApprovalForAll(binaryArgs: StaticArray<u8>): void {
  const sender = Context.caller().toString();
  const args = new Args(binaryArgs);
  const operator = args
    .nextString()
    .expect('operator argument is missing or invalid');
  const approved = args
    .nextBool()
    .expect('approved argument is missing or invalid');

  _setApprovalForAll(sender, operator, approved);
}

export function isApprovedForAll(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const owner = args
    .nextString()
    .expect('owner argument is missing or invalid');
  const operator = args
    .nextString()
    .expect('operator argument is missing or invalid');

  return boolToByte(_isApprovedForAll(owner, operator));
}

export function safeTransferFrom(binaryArgs: StaticArray<u8>): void {
  const sender = Context.caller().toString();
  const args = new Args(binaryArgs);
  const from = args.nextString().expect('from argument is missing or invalid');
  const to = args.nextString().expect('to argument is missing or invalid');
  const id = args.nextU256().expect('id argument is missing or invalid');
  const value = args.nextU256().expect('value argument is missing or invalid');
  const data = args.nextBytes().expect('data argument is missing or invalid');
  assert(from != sender && _isApprovedForAll(from, sender), 'ERC1155MissingApprovalForAll');

  _safeTransferFrom(from, to, id, value, data);
}

export function batchSafeTransferFrom(binaryArgs: StaticArray<u8>): void {
  const sender = Context.caller().toString();
  const args = new Args(binaryArgs);
  const from = args
    .nextString()
    .expect('from argument is missing or invalid');
  const to = args.nextString().expect('to argument is missing or invalid');
  const ids = args
    .nextU256Array()
    .expect('ids argument is missing or invalid');
  const values = args
    .nextU256Array()
    .expect('values argument is missing or invalid');
    const data = args
    .nextBytes()
    .expect('data argument is missing or invalid');
  assert(from != sender && _isApprovedForAll(from, sender), 'ERC1155MissingApprovalForAll');

  _batchSafeTransferFrom(from, to, ids, values, data);
}
