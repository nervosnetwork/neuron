import { ResponseCode, ChannelResponse } from '.'
import WalletChannel from '../channel/wallet'
import TransactionsService, {
  Transaction,
  TransactionsByAddressesParam,
  PaginationResult,
  TransactionsByLockHashesParam,
} from '../services/transactions'

export default class TransactionsController {
  public channel: WalletChannel

  static service = new TransactionsService()

  constructor(channel: WalletChannel) {
    this.channel = channel
  }

  public static getAll = (params: TransactionsByLockHashesParam): ChannelResponse<PaginationResult<Transaction>> => {
    const transactions = TransactionsService.getAll(params)

    if (!transactions) {
      return {
        status: ResponseCode.Fail,
        msg: 'Transactions not found',
      }
    }

    return {
      status: ResponseCode.Success,
      result: transactions,
    }
  }

  public static getAllByAddresses = (
    params: TransactionsByAddressesParam,
  ): ChannelResponse<PaginationResult<Transaction>> => {
    const transactions = TransactionsService.getAllByAddresses(params)

    if (transactions) {
      return {
        status: ResponseCode.Success,
        result: transactions,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Transactions not found',
    }
  }

  public static get = (hash: string): ChannelResponse<Transaction> => {
    const transaction = TransactionsService.get(hash)
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

  public static create = (transaction: Transaction): ChannelResponse<Transaction> => {
    const success = TransactionsService.create(transaction)
    if (success) {
      return {
        status: ResponseCode.Success,
        result: transaction,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Fail to create transaction',
    }
  }

  public static delete = (hash: string): ChannelResponse<boolean> => {
    const success = TransactionsService.delete(hash)
    if (success) {
      return {
        status: ResponseCode.Success,
        result: true,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Fail to delete transaction',
    }
  }
}
