import { ResponseCode } from '.'
import { Transaction } from '../appTypes/types'
import TransactionsService, {
  TransactionsByAddressesParam,
  PaginationResult,
  TransactionsByLockHashesParam,
} from '../services/transactions'

export default class TransactionsController {
  static service = new TransactionsService()

  public static getAll = async (
    params: TransactionsByLockHashesParam,
  ): Promise<Controller.Response<PaginationResult<Transaction>>> => {
    const transactions = await TransactionsService.getAll(params)

    if (!transactions) {
      return {
        status: ResponseCode.Fail,
        msg: 'Transactions not found',
      }
    }

    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions },
    }
  }

  public static getAllByAddresses = async (
    params: TransactionsByAddressesParam,
  ): Promise<Controller.Response<PaginationResult<Transaction>>> => {
    const transactions = await TransactionsService.getAllByAddresses(params)

    if (transactions) {
      return {
        status: ResponseCode.Success,
        result: { ...params, ...transactions },
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Transactions not found',
    }
  }

  public static get = async (hash: string): Promise<Controller.Response<Transaction>> => {
    const transaction = await TransactionsService.get(hash)
    if (!transaction) {
      return {
        status: ResponseCode.Fail,
        msg: 'Transaction not found',
      }
    }
    return {
      status: ResponseCode.Success,
      result: transaction,
    }
  }
}
