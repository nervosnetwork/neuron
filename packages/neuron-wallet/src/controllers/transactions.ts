import { ResponseCode } from '.'
import { Transaction } from '../appTypes/types'
import TransactionsService, {
  TransactionsByAddressesParam,
  PaginationResult,
  TransactionsByLockHashesParam,
} from '../services/transactions'
import { CatchControllerError } from '../utils/decorators'
import i18n from '../utils/i18n'

/**
 * @class TransactionsController
 * @description handle messages from transactions channel
 */
export default class TransactionsController {
  static service = new TransactionsService()

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
    const transactions = await TransactionsService.getAllByAddresses(params)

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
