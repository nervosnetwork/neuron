import { OutPoint, Cell } from './cell'
import { mockedTransaction } from './mock'

export interface Transaction {
  hash: string
  version: number
  deps: OutPoint[]
  inputs?: any
  outputs?: Cell[]
}

// if addresses set to null, should be all transactions
export const getTransactions = async (addresses: string[] | null, page: number, perPage: number) => {
  const transaction: Transaction = mockedTransaction

  return {
    totalCount: page * perPage,
    transactions: Array.from({
      length: perPage,
    }).map(() => transaction),
    addresses,
  }
}

export default {
  getTransactions,
}
