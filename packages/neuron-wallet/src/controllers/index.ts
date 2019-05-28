import AppController from './app'
import NetworksController, { NetworksMethod } from './networks'
import WalletsController from './wallets'
import TransactionsController from './transactions'
import HelpersController, { HelpersMethod } from './helpers'

import WalletsMethod from './wallets/methods'

export const methods = {
  NetworksMethod,
  WalletsMethod,
  HelpersMethod,
}

export default {
  AppController,
  NetworksController,
  WalletsController,
  TransactionsController,
  HelpersController,
}
