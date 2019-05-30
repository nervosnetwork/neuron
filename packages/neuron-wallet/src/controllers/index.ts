import AppController from './app'
import NetworksController from './networks'
import WalletsController from './wallets'
import TransactionsController from './transactions'
import HelpersController, { HelpersMethod } from './helpers'

import WalletsMethod from './wallets/methods'
import NetworksMethod from './networks/methods'

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
