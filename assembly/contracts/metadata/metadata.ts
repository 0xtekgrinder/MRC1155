/**
 *
 * This is an extension to the ERC1155 standard.
 *
 * It allows to store uri for each token id
 * It should be used with the internal functions from metadata-internal
 *
 */

import { u256 } from 'as-bignum/assembly';
import { _uri } from './metadata-internal';
import { stringToBytes } from '@massalabs/as-types';

/**
 *
 * Get the URI for a token id
 *
 * @param id - the id of the token
 *
 * @returns the URI for the token
 *
 */
export function uri(id: u256): StaticArray<u8> {
  return stringToBytes(_uri(id));
}
