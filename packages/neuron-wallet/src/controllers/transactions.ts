import { Transaction } from '../app-types/types'
import TransactionsService, {
  TransactionsByAddressesParam,
  PaginationResult,
  TransactionsByLockHashesParam,
} from '../services/transactions'

import AddressService from '../services/addresses'
import WalletsService from '../services/wallets'

import { Controller as ControllerDecorator, CatchControllerError } from '../decorators'
import { Channel, ResponseCode } from '../utils/const'
import { TransactionNotFound, CurrentWalletNotSet, ServiceHasNoResponse } from '../exceptions'

/**
 * @class TransactionsController
 * @description handle messages from transactions channel
 */
@ControllerDecorator(Channel.Transactions)
export default class TransactionsController {
  @CatchControllerError
  public static async getAll(
    params: TransactionsByLockHashesParam
  ): Promise<Controller.Response<PaginationResult<Transaction>>> {
    const transactions = await TransactionsService.getAll(params)

    if (!transactions) throw new ServiceHasNoResponse('Transactions')

    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions },
    }
  }

  @CatchControllerError
  public static async getAllByAddresses(
    params: TransactionsByAddressesParam
  ): Promise<Controller.Response<PaginationResult<Transaction> & TransactionsByAddressesParam>> {
    const { pageNo, pageSize, addresses } = params

    let searchAddresses = [...addresses]

    if (!searchAddresses.length) {
      const wallet = WalletsService.getInstance().getCurrent()
      if (!wallet) throw new CurrentWalletNotSet()
      searchAddresses = AddressService.searchUsedAddresses(wallet.extendedPublicKey()).map(addr => addr.address)
    }

    const transactions = await TransactionsService.getAllByAddresses({ pageNo, pageSize, addresses: searchAddresses })

    if (!transactions) throw new ServiceHasNoResponse('Transactions')

    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions },
    }
  }

  @CatchControllerError
  public static async get(hash: string): Promise<Controller.Response<Transaction>> {
    const transaction = await TransactionsService.get(hash)

    if (!transaction) throw new TransactionNotFound(hash)

    return {
      status: ResponseCode.Success,
      result: transaction,
    }
  }
}

/* eslint-disable*/
declare global {
  module Controller {
    type TransactionsMethod = Exclude<keyof typeof TransactionsController, keyof typeof Object>
  }
}
/* eslint-enable */
