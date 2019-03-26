import TransactionsService, { Transaction } from '../services/transactions'
import { ResponseCode, Response } from '.'
import WalletChannel from '../channel/wallet'

export default class TransactionsController {
  public channel: WalletChannel

  static service = new TransactionsService()

  constructor(channel: WalletChannel) {
    this.channel = channel
  }

  public static index = (): Response<Transaction[]> => {
    const transactions = TransactionsService.index()
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

  public static show = (hash: string): Response<Transaction> => {
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

  public static create = (transaction: Transaction): Response<Transaction> => {
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

  public static delete = (hash: string): Response<boolean> => {
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
