import { Args } from "@massalabs/as-types";
import { _burn, _burnBatch, _isApprovedForAll } from "../token-internal";
import { Context } from "@massalabs/massa-as-sdk";

export async function burn(binaryArgs: StaticArray<u8>) {
    const sender = Context.caller().toString();
    const args = new Args(binaryArgs);
    const account = args.nextString().expect('account argument is missing or invalid');
    const id = args.nextU256().expect('id argument is missing or invalid');
    const value = args.nextU256().expect('value argument is missing or invalid');
    assert(account != sender && _isApprovedForAll(account, sender), 'ERC1155MissingApprovalForAll');

    _burn(account, id, value);
}

export async function burnBatch(binaryArgs: StaticArray<u8>) {
    const sender = Context.caller().toString();
    const args = new Args(binaryArgs);
    const account = args.nextString().expect('account argument is missing or invalid');
    const ids = args.nextU256Array().expect('ids argument is missing or invalid');
    const values = args.nextU256Array().expect('values argument is missing or invalid');
    assert(account != sender && _isApprovedForAll(account, sender), 'ERC1155MissingApprovalForAll');

    _burnBatch(account, ids, values);
}
