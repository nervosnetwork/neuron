import NetworksController, { NetworksMethod } from './networks'
import WalletsController, { WalletsMethod } from './wallets'
import TransactionsController from './transactions'
import HelpersController, { HelpersMethod } from './helpers'

export const methods = {
  NetworksMethod,
  WalletsMethod,
  HelpersMethod,
}

export default {
  NetworksController,
  WalletsController,
  TransactionsController,
  HelpersController,
}
