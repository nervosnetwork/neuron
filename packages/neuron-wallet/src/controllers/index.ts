import NetworksController, { NetworksMethod } from './networks'
import WalletsController, { WalletsMethod } from './wallets'
import TransactionsController from './transactions'
import HelpersController, { HelpersMethod } from './helpers'

export enum ResponseCode {
  Fail,
  Success,
}
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
  ResponseCode,
}
