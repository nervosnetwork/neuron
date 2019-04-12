# Neuron
Nervos CKB Wallet

[![TravisCI](https://travis-ci.com/nervosnetwork/neuron.svg?branch=develop)](https://travis-ci.com/nervosnetwork/neuron)
[![Telegram Group](https://cdn.rawgit.com/Patrolavia/telegram-badge/8fe3382b/chat.svg)](https://t.me/nervos_ckb_dev)

---

## Quick Start

### Prerequisites

You will need `node >= 11.10` and `yarn >= 1.12` to build and run this Neuron.

Please be noted that Neuron depends on [node-gyp](https://github.com/nodejs/node-gyp) to build native NPM modules. Follow [this](https://github.com/nodejs/node-gyp#installation) to install node-gyp dependencies.

In the project directory, you can run:

### `yarn install && yarn bootstrap`

Installs all dependencies.

### `yarn start:ui`

Runs the UI app in the development and watch mode.<br>
Neuron UI will start and open in browser (`http://localhost:3000`).

### `yarn start`

Runs the app in the development mode.<br>
Neuron will start as a desktop app.

### `yarn test`

Launches the test runner in the watch mode.

## License

Neuron is released under the terms of the MIT license. See [COPYING](COPYING) for more information or see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
