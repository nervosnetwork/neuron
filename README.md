# Neuron

Nervos CKB Desktop Wallet

[![Azure Pipelines Build Status](https://dev.azure.com/nervosnetwork/neuron/_apis/build/status/nervosnetwork.neuron?branchName=develop)](https://dev.azure.com/nervosnetwork/neuron/_build/latest?definitionId=8&branchName=develop)
[![TravisCI](https://travis-ci.com/nervosnetwork/neuron.svg?branch=develop)](https://travis-ci.com/nervosnetwork/neuron)
[![Telegram Group](https://cdn.rawgit.com/Patrolavia/telegram-badge/8fe3382b/chat.svg)](https://t.me/nervos_ckb_dev)

---

## Quick Start

### Prerequisites

You will need `node >= 12` and `yarn >= 1.14` to build and run Neuron.

#### Lerna

This project uses [lerna](https://github.com/lerna/lerna/) for package management. It can be installed either globally or locally within the project:

```sh
$ yarn global add lerna # install lerna globally
# or
$ yarn add lerna --exact --ignore-workspace-root-check # install lerna locally within the project
```

#### Install Dependencies

After lerna has been installed, run this to install and link dependencies:

```sh
$ yarn bootstrap
```

### Start Neuron

A local CKB node is required for Neuron wallet to talk to it via RPC APIs and get data. Please follow the [CKB Nervos doc](https://docs.nervos.org/getting-started/introduction) to get CKB node up and running first.

### Start Neuron in Development Mode

```sh
$ yarn start
```

This command will start two tasks:

1. start `neuron-ui`, which is the React UI layer.
2. start `neuron-wallet`, which is the core wallet layer.

You can also start them independently:

```sh
# start neuron-ui at `http://localhost:3000`
$ yarn start:ui
```

```sh
# start neuron-wallet
$ yarn start:wallet
```

### Test

```sh
# launch the test runner.
$ yarn test
```

## Download Neuron Binary

If you don't want to bother building from source, you can download a binary from [releases](https://github.com/nervosnetwork/neuron/releases). We offer pre-built binaries for Windows, Linux and macOS.

## License

Neuron is released under the terms of the MIT license. See [COPYING](COPYING) for more information or see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
