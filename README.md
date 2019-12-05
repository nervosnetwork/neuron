# Neuron

Nervos CKB Desktop Wallet

[![Azure Pipelines Build Status](https://dev.azure.com/nervosnetwork/neuron/_apis/build/status/nervosnetwork.neuron?branchName=develop)](https://dev.azure.com/nervosnetwork/neuron/_build/latest?definitionId=8&branchName=develop)
[![Telegram Group](https://cdn.rawgit.com/Patrolavia/telegram-badge/8fe3382b/chat.svg)](https://t.me/nervos_ckb_dev)

---

## Quick Start

### Prerequisites

You will need `node >= 12` and `yarn >= 1.14` to build and run Neuron.

#### Lerna

This project uses [lerna](https://github.com/lerna/lerna/) for package management.

```shell
$ yarn global add lerna # install lerna globally
```

#### Install Dependencies

After lerna has been installed, run this to install and link dependencies:

```shell
$ yarn bootstrap
```

### Start Neuron

As of `v0.26.0`, Neuron bundles a CKB binary and starts it for Mainnet automatically. If you prefer to run a local CKB node yourself instead, please follow the [Nervos CKB doc](https://docs.nervos.org/references/neuron-wallet-guide.html#1-run-a-ckb-mainnet-node) to get it up and running before launching Neuron.

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

### Test

```shell
$ yarn test
```

## Download Neuron Binary

If you don't want to bother building from source, you can download a binary from [releases](https://github.com/nervosnetwork/neuron/releases). We offer pre-built binaries for Windows, Linux and macOS.

## License

Neuron is released under the terms of the MIT license. See [COPYING](COPYING) for more information or see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
