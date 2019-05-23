import { ResponseCode } from '.'
import { Transaction } from '../appTypes/types'
import TransactionsService, {
  TransactionsByAddressesParam,
  PaginationResult,
  TransactionsByLockHashesParam,
} from '../services/transactions'
import { CatchControllerError } from '../utils/decorators'
import i18n from '../utils/i18n'

export default class TransactionsController {
  static service = new TransactionsService()

  /**
   * @method getAll
   * @static
   * @memberof TransactionsController
   * @description get all transactions
   */
  @CatchControllerError
  public static async getAll(
    params: TransactionsByLockHashesParam,
  ): Promise<Controller.Response<PaginationResult<Transaction>>> {
    const transactions = await TransactionsService.getAll(params)

    if (!transactions) throw new Error(i18n.t('messages.no-response-from-transaction-service'))

    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions },
    }
  }

  /**
   * @method getAllByAddresses
   * @static
   * @memberof TransactionsController
   * @description get all transactions by page number, page size, address list
   */
  @CatchControllerError
  public static async getAllByAddresses(
    params: TransactionsByAddressesParam,
  ): Promise<Controller.Response<PaginationResult<Transaction>>> {
    const transactions = await TransactionsService.getAllByAddresses(params)

    if (!transactions) throw new Error(i18n.t('messages.no-response-from-transaction-service'))

    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions },
    }
  }

  /**
   * @method get
   * @static
   * @memberof TransactionsController
   * @description get transaction by hash
   */
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
