import { ResponseCode, ChannelResponse } from '.'
import WalletChannel from '../channel/wallet'
import TransactionsService, { Transaction, TransactionsParams } from '../services/transactions'

export default class TransactionsController {
  public channel: WalletChannel

  static service = new TransactionsService()

  constructor(channel: WalletChannel) {
    this.channel = channel
  }

  public static index = (
    params?: TransactionsParams,
  ): ChannelResponse<
    { pageNo: number; pageSize: number; totalCount: number; items: Transaction[] } | Transaction[]
  > => {
    const transactions = TransactionsService.index(params)
    if (transactions) {
      if (!params) {
        return {
          status: ResponseCode.Success,
          result: transactions,
        }
      }
      return {
        status: ResponseCode.Success,
        result: {
          ...params,
          totalCount: TransactionsService.index().length,
          items: transactions,
        },
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Transactions not found',
    }
  }

  public static show = (hash: string): ChannelResponse<Transaction> => {
    const network = TransactionsService.show(hash)
    if (network) {
      return {
        status: ResponseCode.Success,
        result: network,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Transaction not found',
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
