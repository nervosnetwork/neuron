import { transactions } from '../mock'
import { Cell, Script, OutPoint } from '../cell'

export interface Transaction {
  hash: string
  version: number
  deps?: OutPoint[]
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

export interface TransactionsByPubkeysParams {
  pageNo: number
  pageSize: number
  pubkeys: string[]
}

export interface PaginationResult<T = any> {
  totalCount: number
  items: T[]
}

let currentTransaction: Transaction[] = transactions
/* eslint @typescript-eslint/no-unused-vars: "warn" */
export default class TransactionsService {
  public static getAll = (params: TransactionsByLockHashesParam): PaginationResult<Transaction> => {
    return {
      totalCount: params.pageNo * params.pageSize,
      items: transactions,
    }
  }

  public static getAllByAddresses = (params: TransactionsByAddressesParam): PaginationResult<Transaction> => {
    return TransactionsService.getAll({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      lockHashes: [],
    })
  }

  public static getAllByPubkeys = (params: TransactionsByPubkeysParams): PaginationResult<Transaction> => {
    return TransactionsService.getAll({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      lockHashes: [],
    })
  }

  public static get = (hash: string): Transaction | undefined => {
    return transactions.find(tx => tx.hash === hash)
  }

  // check whether the address has history transactions
  public static isExist = (_address: string): boolean => {
    return Math.random() > 0.5
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
