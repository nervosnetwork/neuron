import { transactions, mockedTransaction } from '../mock'
import { Cell, Script, OutPoint } from '../cell'

export interface Transaction {
  hash: string
  version: number
  deps: OutPoint[]
  inputs?: any
  outputs?: Cell[]
  time?: number
  value?: string
}

export interface Input {
  previousOutput: OutPoint
  unlock: Script
}
export interface TransactionsByAddressesParam {
  pageNo: number
  pageSize: number
  addresses: string[]
}

export interface TransactionsByLockHashesParam {
  pageNo: number
  pageSize: number
  lockHashes: string[]
}

export interface PaginationResult<T = any> {
  totalCount: number
  items: T[]
}

let currentTransaction: any[] = transactions
/* eslint @typescript-eslint/no-unused-vars: "warn" */
export default class TransactionsService {
  public static getAll = (params: TransactionsByLockHashesParam): PaginationResult<Transaction> => {
    const transaction: Transaction = mockedTransaction

    return {
      totalCount: params.pageNo * params.pageSize,
      items: Array.from({
        length: params.pageSize,
      }).map(() => transaction),
    }
  }

  public static getAllByAddresses = (params: TransactionsByAddressesParam) => {
    return TransactionsService.getAll({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      lockHashes: [],
    })
  }

  public static get = (_hash: string) => {
    return mockedTransaction
  }

  public static create = (transaction: Transaction): Transaction => {
    const sameTransaction = TransactionsService.get(transaction.hash)
    if (sameTransaction) {
      throw new Error('Transaction exists')
    }
    currentTransaction.push(transaction)
    return transaction
  }

  public static delete = (hash: string): boolean => {
    const transaction = TransactionsService.get(hash)
    if (transaction) {
      currentTransaction = currentTransaction.filter(tx => tx.hash !== hash)
      return true
    }
    return false
  }
}
