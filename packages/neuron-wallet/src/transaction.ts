import { OutPoint, Cell } from './cell'
import { mockedTransaction } from './mock'

export interface Transaction {
  hash: string
  version: number
  deps: OutPoint[]
  inputs?: any
  outputs?: Cell[]
}

// if addresses set to undefined, should be all transactions
/* eslint @typescript-eslint/no-unused-vars: "warn" */
export const getTransactions = async (page: number, perPage: number, _addresses?: string[] | undefined) => {
  const transaction: Transaction = mockedTransaction

  return {
    totalCount: page * perPage,
    transactions: Array.from({
      length: perPage,
    }).map(() => transaction),
  }
}

export default {
  getTransactions,
}
