# Neuron

Nervos CKB Full-Node Desktop Wallet

[![Unit Tests](https://github.com/nervosnetwork/neuron/actions/workflows/unit_tests.yml/badge.svg)](https://github.com/nervosnetwork/neuron/actions/workflows/unit_tests.yml)
[![Discord](https://img.shields.io/discord/956765352514183188?label=Discord&logo=discord&style=default&color=grey&labelColor=5865F2&logoColor=white)](https://discord.gg/N9nZ3JE2Gg)

---

## Quick Start

### Prerequisites

You will need `node >= 18.12.0` and `yarn >= 1.14` to build and run Neuron.

#### Lerna

This project uses [lerna](https://github.com/lerna/lerna/) for package management.

```shell
$ yarn global add lerna # install lerna globally
```

#### Install Dependencies

> Notes: 
> 1. Please set [proxy](https://www.electronjs.org/docs/latest/tutorial/installation#proxies) if you are using a proxy locally and find the downloading is halted
> 2. Please set [CDN](https://www.electronjs.org/docs/latest/tutorial/installation#mirror) if the downloading is slow

After lerna has been installed, run this to install and link dependencies:

```shell
$ yarn
$ lerna run rebuild:nativemodules
```

#### Add CKB Indexer

CKB Indexer is a service to create cell and transaction indexes.

Download [CKB Indexer](https://github.com/nervosnetwork/ckb-indexer/releases) and move the binary into `packages/neuron-wallet/bin/{win/linux/mac}/`.

### Start Neuron

As of `v0.26.0`, Neuron bundles a CKB binary and starts it for Mainnet automatically. If you prefer to run a local CKB node yourself instead, please follow the [Nervos CKB doc](https://docs.nervos.org/docs/basics/guides/mainnet) to get it up and running before launching Neuron.

**Note**: If you run CKB node on Windows but it fails to start, you may need to download and install the latest [Microsoft Visual C++ Redistributable for Visual Studio 2015, 2017 and 2019](https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads).

### Start Neuron in Development Mode

```shell
$ ./scripts/download-ckb.sh # Download CKB binary for your platform. Neuron will starts it automatically.
$ yarn start
```

This command starts `neuron-ui`, the React UI layer and `neuron-wallet`, the core wallet layer.

You can also start them independently:

```shell
# start neuron-ui at `http://localhost:3000`
$ yarn start:ui
```

```shell
# start neuron-wallet
$ yarn start:wallet
```

If you want to develop with devnet, replace the testnet script with the dev script in the `packages/neuron-wallet/.env` file.

Here is a script env example, it is constructed by network、script name and filed name.

```
TESTNET_SUDT_DEP_TXHASH=0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769
TESTNET_SUDT_DEP_INDEX=0
TESTNET_SUDT_DEP_TYPE=code
TESTNET_SUDT_SCRIPT_CODEHASH=0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4
TESTNET_SUDT_SCRIPT_HASHTYPE=type
```

### Test

```shell
$ yarn test
```

## Download Neuron Binary

If you don't want to bother building from source, you can download a binary from [releases](https://github.com/nervosnetwork/neuron/releases). We offer pre-built binaries for Windows, Linux and macOS.

## License

Neuron is released under the terms of the MIT license. See [COPYING](COPYING) for more information or see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
