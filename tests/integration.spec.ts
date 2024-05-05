import * as dotenv from 'dotenv';
import path from 'path';
import { readFileSync } from 'fs';
import { getEnvVariable } from '../src/utils';
import { deploySC, WalletClient, ISCData } from '@massalabs/massa-sc-deployer';
import {
  Args,
  fromMAS,
  MAX_GAS_DEPLOYMENT,
  CHAIN_ID,
  IAccount,
  DefaultProviderUrls,
  Client,
  ClientFactory,
  EOperationStatus,
  ArrayTypes
} from '@massalabs/massa-web3';
import { fileURLToPath } from 'url';

// Obtain the current file name and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));

// Load .env file content into process.env
dotenv.config();

// Get environment variables
const secretKey = getEnvVariable('WALLET_SECRET_KEY');
// Define deployment parameters
const chainId = CHAIN_ID.BuildNet; // Choose the chain ID corresponding to the network you want to deploy to
const maxGas = MAX_GAS_DEPLOYMENT; // Gas for deployment Default is the maximum gas allowed for deployment
const fees = 100000000n; // Fees to be paid for deployment. Default is 0
const waitFirstEvent = true;

let deployerAccount: IAccount;

let nft: string;
let onERC1155Received: string;
let onERC1155ReceivedFail: string;

let testnetClient: Client;

async function onERC1155BatchReceivedTestNormal() {
  if (!deployerAccount.address) throw new Error('Invalid deployer account');
  console.log('should transfer tokens and call onERC1155Received');
  const data = 'transfer data';
  const from = deployerAccount.address;
  const to = onERC1155Received;
  const ids = [100n, 111n];
  const values = [1n, 1n];
  const operationId = await testnetClient.smartContracts().callSmartContract({
    targetAddress: nft,
    functionName: 'safeBatchTransferFrom',
    parameter: new Args()
      .addString(from)
      .addString(to)
      .addArray(ids, ArrayTypes.U256)
      .addArray(values, ArrayTypes.U256)
      .addString(data)
      .serialize(),
    maxGas: BigInt(2100000000),
    coins: fromMAS(0.5),
    fee: 100000000n,
  });
  await testnetClient.smartContracts().awaitRequiredOperationStatus(operationId, EOperationStatus.FINAL_SUCCESS);
  const events = await testnetClient.smartContracts().getFilteredScOutputEvents({
    emitter_address: null,
    start: null,
    end: null,
    original_caller_address: null,
    original_operation_id: operationId,
    is_final: null,
  });
  console.log(events[events.length - 1].data, `ERC1155BatchReceived:${from},${from},${ids.join(';')},${values.join(';')},${data.split('').map((c) => c.charCodeAt(0)).join(',')}`);
  if (events[events.length - 1].data !== `ERC1155BatchReceived:${from},${from},${ids.join(';')},${values.join(';')},${data.split('').map((c) => c.charCodeAt(0)).join(',')}`) {
    throw new Error('Invalid event data');
  }
}

async function onERC1155BatchReceivedTestFail() {
  if (!deployerAccount.address) throw new Error('Invalid deployer account');
  console.log('should reverts if wrong return value');
  const data = 'transfer data';
  const from = deployerAccount.address;
  const to = onERC1155ReceivedFail;
  const ids = [100n, 111n];
  const values = [1n, 1n];
  const operationId = await testnetClient.smartContracts().callSmartContract({
    targetAddress: nft,
    functionName: 'safeBatchTransferFrom',
    parameter: new Args()
      .addString(from)
      .addString(to)
      .addArray(ids, ArrayTypes.U256)
      .addArray(values, ArrayTypes.U256)
      .addString(data)
      .serialize(),
    maxGas: BigInt(2100000000),
    coins: fromMAS(0.5),
    fee: 100000000n,
  });
  await testnetClient.smartContracts().awaitRequiredOperationStatus(operationId, EOperationStatus.FINAL_ERROR);
}

async function onERC1155ReceivedTestNormal() {
  if (!deployerAccount.address) throw new Error('Invalid deployer account');
  console.log('should transfer tokens and call onERC1155Received');
  const data = 'transfer data';
  const from = deployerAccount.address;
  const to = onERC1155Received;
  const id = 100n;
  const value = 1n;
  const operationId = await testnetClient.smartContracts().callSmartContract({
    targetAddress: nft,
    functionName: 'safeTransferFrom',
    parameter: new Args()
      .addString(from)
      .addString(to)
      .addU256(id)
      .addU256(value)
      .addString(data)
      .serialize(),
    maxGas: BigInt(2100000000),
    coins: fromMAS(0.5),
    fee: 100000000n,
  });
  await testnetClient.smartContracts().awaitRequiredOperationStatus(operationId, EOperationStatus.FINAL_SUCCESS);
  const events = await testnetClient.smartContracts().getFilteredScOutputEvents({
    emitter_address: null,
    start: null,
    end: null,
    original_caller_address: null,
    original_operation_id: operationId,
    is_final: null,
  });
  if (events[events.length - 1].data !== `ERC1155Received:${from},${from},${id},${value},${data.split('').map((c) => c.charCodeAt(0)).join(',')}`) {
    throw new Error('Invalid event data');
  }
}

async function onERC1155ReceivedTestFail() {
  if (!deployerAccount.address) throw new Error('Invalid deployer account');
  console.log('should reverts if wrong return value');
  const data = 'transfer data';
  const from = deployerAccount.address;
  const to = onERC1155ReceivedFail;
  const id = 100n;
  const value = 1n;
  const operationId = await testnetClient.smartContracts().callSmartContract({
    targetAddress: nft,
    functionName: 'safeTransferFrom',
    parameter: new Args()
      .addString(from)
      .addString(to)
      .addU256(id)
      .addU256(value)
      .addString(data)
      .serialize(),
    maxGas: BigInt(2100000000),
    coins: fromMAS(0.5),
    fee: 100000000n,
  });
  await testnetClient.smartContracts().awaitRequiredOperationStatus(operationId, EOperationStatus.FINAL_ERROR);
}

async function beforeAll() {
  // Create an account using the private sdkeyc
  deployerAccount = await WalletClient.getAccountFromSecretKey(secretKey);
  const res1 = await deploySC(
    DefaultProviderUrls.BUILDNET, // JSON RPC URL
    deployerAccount, // account deploying the smart contract(s)
    [
        {
          data: readFileSync(path.join(__dirname, '..', 'build', 'NFT-exemple.wasm')), // smart contract bytecode
          coins: fromMAS(0.1), // coins for deployment
          args: new Args().addString(
            'ipfs://QmW77ZQQ7Jm9q8WuLbH8YZg2K7T9Qnjbzm7jYVQQrJY5Yd',
          ).addArray([100n, 111n], ArrayTypes.U256).addArray([100n, 100n], ArrayTypes.U256), // arguments for deployment
        } as ISCData,
      // Additional smart contracts can be added here for deployment
    ],
    chainId,
    fees,
    maxGas,
    waitFirstEvent,
  );
  const res2 = await deploySC(
    DefaultProviderUrls.BUILDNET, // JSON RPC URL
    deployerAccount, // account deploying the smart contract(s)
    [
        {
          data: readFileSync(path.join(__dirname, '..', 'build', 'OnERC1155Received.wasm')), // smart contract bytecode
          coins: fromMAS(0.1), // coins for deployment
          args: new Args(), // arguments for deployment
        } as ISCData,
      // Additional smart contracts can be added here for deployment
    ],
    chainId,
    fees,
    maxGas,
    waitFirstEvent,
  );
  const res3 = await deploySC(
    DefaultProviderUrls.BUILDNET, // JSON RPC URL
    deployerAccount, // account deploying the smart contract(s)
    [
        {
          data: readFileSync(path.join(__dirname, '..', 'build', 'OnERC1155ReceivedFail.wasm')), // smart contract bytecode
          coins: fromMAS(0.1), // coins for deployment
          args: new Args(), // arguments for deployment
        } as ISCData,
      // Additional smart contracts can be added here for deployment
    ],
    chainId,
    fees,
    maxGas,
    waitFirstEvent,
  );
  if (!res2.events || !res1.events || !res3.events) throw new Error('Invalid events');
  
  nft = res1?.events[res1?.events.length - 1].data.split(': ')[1];
  onERC1155Received = res2?.events[res2?.events.length - 1].data.split(': ')[1];
  onERC1155ReceivedFail = res3?.events[res3?.events.length - 1].data.split(': ')[1];
  
  testnetClient = await ClientFactory.createDefaultClient(
    DefaultProviderUrls.BUILDNET,
    chainId,
    true, // retry failed requests
    deployerAccount, // optional parameter
  );
}

(async () => {
  beforeAll();

  console.log('onERC1155Received');
  await onERC1155ReceivedTestNormal();
  await onERC1155ReceivedTestFail();

  console.log('onERC1155BatchReceived');
  await onERC1155BatchReceivedTestNormal();
  await onERC1155BatchReceivedTestFail();
})();
