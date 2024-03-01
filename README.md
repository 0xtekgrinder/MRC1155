# MRC1155

This repository contains a set of smart contracts to implement the ERC1155 standard on the Massa blockchain.

On top of that it also includes multiples extensions to the standard to allow for more complex use cases:
- [burnable](./assembly/contracts/burnable.sol)
- [mintable](./assembly/contracts/mintable.sol)
- [metadata](./assembly/contracts/metadata.sol)

It can be easily merged into massa-standards as this repository contains a set of smart contracts that are fully compatible with the ERC1155 standard with the only common depencies being ownership contract.

## Installation

```shell
npm install
```

## Documentation

A documentation for each functions internals or externals has been created that can be found just before the functions declarations.

## Build

```shell
npm run build
```

## Deploy a smart contract

Prerequisites :

- You must add a `.env` file at the root of the repository with the following keys set to valid values :
  - WALLET_SECRET_KEY="wallet_secret_key"
  - JSON_RPC_URL_PUBLIC=<https://test.massa.net/api/v2:33035>

```shell
npm run deploy
```

## Unit tests

A big set of unit tests has been written to ensure the correctness of the smart contracts compared to the standard and some security related checks.

The only missing coverage is for the call of the ERC1155Receiver function which cannot be tested with the current mocked tests environment.

```shell
npm run test
```

## Format code

```shell
npm run fmt
```
