import { transactions } from '../mock'

export interface Transaction {
  hash: string
  type: number
  date: number
  value: string
}
export interface TransactionsParams {
  pageNo: number
  pageSize: number
  addresses: string[]
}
let currentTransaction: Transaction[] = transactions
export default class TransactionsService {
  public static index = (params?: TransactionsParams): Transaction[] => {
    if (params) {
      // TODO
    }
    return currentTransaction
  }

  public static show = (hash: string): Transaction | undefined => {
    return currentTransaction.find(transaction => transaction.hash === hash)
  }

  public static create = (transaction: Transaction): Transaction => {
    const sameTransaction = TransactionsService.show(transaction.hash)
    if (sameTransaction) {
      throw new Error('Transaction exists')
    }
    currentTransaction.push(transaction)
    return transaction
  }

  public static delete = (hash: string): boolean => {
    const transaction = TransactionsService.show(hash)
    if (transaction) {
      currentTransaction = currentTransaction.filter(tx => tx.hash !== hash)
      return true
    }
    return false
  }
}
