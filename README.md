# Neuron

Nervos CKB Wallet

[![Azure Pipelines Build Status](https://dev.azure.com/nervosnetwork/neuron/_apis/build/status/nervosnetwork.neuron?branchName=develop)](https://dev.azure.com/nervosnetwork/neuron/_build/latest?definitionId=8&branchName=develop)
[![TravisCI](https://travis-ci.com/nervosnetwork/neuron.svg?branch=develop)](https://travis-ci.com/nervosnetwork/neuron)
[![Telegram Group](https://cdn.rawgit.com/Patrolavia/telegram-badge/8fe3382b/chat.svg)](https://t.me/nervos_ckb_dev)

---

## Quick Start

### Prerequisites

You will need `node >= 12` and `yarn >= 1.14` to build and run Neuron.

Please be noted that Neuron depends on [node-gyp](https://github.com/nodejs/node-gyp) to build native NPM modules. Follow [this](https://github.com/nodejs/node-gyp#installation) to install node-gyp dependencies.

#### Lerna

Neuron project uses [lerna](https://github.com/lerna/lerna/) for packages management. It can be installed globally, or locally in the project.

```sh
$ yarn global add lerna # install lerna globally
# or
$ yarn add lerna --exact --ignore-workspace-root-check # install lerna locally in the project
```

#### Install Dependencies

After lerna installed, the dependencies can be installed by

```sh
$ yarn bootstrap
```

### Start Neuron

### Start Neuron in development mode

```sh
$ yarn start
```

This command will start two tasks

1. start `neuron-ui`, which works for the user interface.
2. start `neuron-wallet`, works for the wallet functionality.

They are also able to start independently:

```sh
# start neuron-ui at `http://localhost:3000`
$ cd packages/neuron-ui && yarn start
```

```sh
# start neuron-wallet
$ cd packages/neuron-wallet && yarn start:dev
```

### Test

```sh
# launch the test runner in the watch mode.
$ yarn test
```

## License

Neuron is released under the terms of the MIT license. See [COPYING](COPYING) for more information or see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
