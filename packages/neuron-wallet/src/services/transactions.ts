import { getConnection } from 'typeorm'
import { Cell, OutPoint } from '../cell'
import TransactionEntity from '../entities/Transaction'
import { getHistoryTransactions } from '../mock_rpc'

export interface Input {
  previousOutput: OutPoint
  args: string[]
}

export interface Witness {
  data: string[]
}

export interface Transaction {
  hash: string
  version: number
  deps?: OutPoint[]
  inputs?: Input[]
  outputs?: Cell[]
  timestamp?: string
  value?: string
  blockNumber?: string
  blockHash?: string
  witnesses?: Witness[]
  type?: string
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

/* eslint @typescript-eslint/no-unused-vars: "warn" */
export default class TransactionsService {
  public static getAll = (params: TransactionsByLockHashesParam): PaginationResult<Transaction> => {
    // TODO: calculate lockHashes when saving transactions
    let totalCount: number | undefined
    TransactionEntity.count().then(n => {
      totalCount = n
    })
    const connection = getConnection()
    let transactions: TransactionEntity[]
    const skip = (params.pageNo - 1) * params.pageSize
    connection
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .skip(skip)
      .take(params.pageSize)
      .getMany()
      .then(n => {
        transactions = n
      })

    const txs: Transaction[] = transactions!.map(tx => ({
      timestamp: tx.timestamp,
      value: tx.value,
      hash: tx.hash,
      version: tx.version,
      type: tx.type,
    }))

    return {
      totalCount: totalCount || 0,
      items: txs,
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
    let transaction
    TransactionEntity.findOne(hash).then(tx => {
      transaction = tx
    })
    return transaction
  }

  // check whether the address has history transactions
  public static hasTransactions = (_address: string): boolean => {
    return Math.random() >= 0.5
  }

  public static create = async (transaction: Transaction): Promise<TransactionEntity> => {
    const tx = new TransactionEntity()
    tx.hash = transaction.hash
    tx.version = transaction.version
    tx.deps = transaction.deps!
    tx.inputs = transaction.inputs!
    tx.outputs = transaction.outputs!
    tx.timestamp = transaction.timestamp!
    tx.value = transaction.value!
    tx.blockHash = transaction.blockHash!
    tx.blockNumber = transaction.blockNumber!
    tx.witnesses = transaction.witnesses!
    tx.type = transaction.type!
    const txEntity = await tx.save()
    return txEntity
  }

  /* eslint no-await-in-loop: "warn" */
  // NO parallel
  public static loadTransactionsHistoryFromChain = async (lockHashes: string[]) => {
    // TODO: to => get_tip_block_number
    const to = 1000
    let currentFrom = 0
    let currentTo = to
    while (currentFrom <= to) {
      currentTo = Math.min(currentFrom + 100, to)
      const txs = await getHistoryTransactions(lockHashes, currentFrom.toString(), currentTo.toString())
      await TransactionsService.convertTransactions(txs)
      currentFrom = currentTo + 1
    }
  }

  public static convertTransactions = async (transactions: Transaction[]): Promise<TransactionEntity[]> => {
    const txEntities: TransactionEntity[] = []

    transactions.forEach(async tx => {
      const txEntity = await TransactionsService.convertTransactionAndCreate(tx)
      txEntities.push(txEntity)
    })

    return txEntities
  }

  public static convertTransactionAndCreate = async (transaction: Transaction): Promise<TransactionEntity> => {
    const tx: Transaction = transaction
    // TODO: calculate value, sum of not return charge output
    tx.value = Math.round(Math.random() * 10000).toString()
    tx.type = ['send', 'receive', 'unknown'][Math.round(Math.random() * 2)]
    const txEntity = await TransactionsService.create(transaction)
    return txEntity
  }
}
