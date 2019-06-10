import { Transaction } from '../app-types/types'
import TransactionsService, {
  TransactionsByAddressesParam,
  PaginationResult,
  TransactionsByLockHashesParam,
} from '../services/transactions'

import AddressService from '../services/addresses'
import WalletsService from '../services/wallets'
import Key from '../keys/key'

import { Controller as ControllerDecorator, CatchControllerError } from '../decorators'
import { Channel, ResponseCode } from '../utils/const'
import i18n from '../utils/i18n'

/**
 * @class TransactionsController
 * @description handle messages from transactions channel
 */
@ControllerDecorator(Channel.Transactions)
export default class TransactionsController {
  @CatchControllerError
  public static async getAll(
    params: TransactionsByLockHashesParam,
  ): Promise<Controller.Response<PaginationResult<Transaction>>> {
    const transactions = await TransactionsService.getAll(params)

    if (!transactions)
      throw new Error(
        i18n.t('messages.transactions-service-not-responds', { service: i18n.t('services.transactions') }),
      )

    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions },
    }
  }

  @CatchControllerError
  public static async getAllByAddresses(
    params: TransactionsByAddressesParam,
  ): Promise<Controller.Response<PaginationResult<Transaction>>> {
    const { pageNo, pageSize, addresses } = params

    let searchAddresses = [...addresses]

    if (!searchAddresses.length) {
      const wallet = WalletsService.getInstance().getCurrent()
      if (!wallet) throw new Error(i18n.t('messages.current-wallet-is-not-found'))
      const key = new Key({ keystore: wallet.loadKeystore() })
      if (!key.keysData) throw new Error(i18n.t('messages.current-key-has-no-data'))
      searchAddresses = AddressService.searchUsedAddresses(key.keysData).map(addr => addr.address)
    }

    const transactions = await TransactionsService.getAllByAddresses({ pageNo, pageSize, addresses: searchAddresses })

    if (!transactions)
      throw new Error(i18n.t('messages.service-not-responds', { service: i18n.t('services.transactions') }))

    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions },
    }
  }

  @CatchControllerError
  public static async get(hash: string): Promise<Controller.Response<Transaction>> {
    const transaction = await TransactionsService.get(hash)

    if (!transaction) throw new Error(i18n.t('messages.transaction-is-not-found', { hash }))

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
