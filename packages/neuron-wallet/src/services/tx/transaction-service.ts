import { getConnection, ObjectLiteral } from 'typeorm'
import { pubkeyToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { Transaction, TransactionWithoutHash, TransactionStatus } from '../../types/cell-types'
import TransactionEntity from '../../database/chain/entities/transaction'
import LockUtils from '../../models/lock-utils'

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

export enum SearchType {
  Address = 'address',
  TxHash = 'txHash',
  Date = 'date',
  Amount = 'amount',
  Empty = 'empty',
  Unknown = 'unknown',
}

/* eslint @typescript-eslint/no-unused-vars: "warn" */
/* eslint no-await-in-loop: "off" */
/* eslint no-restricted-syntax: "off" */
export class TransactionsService {
  public static filterSearchType = (value: string) => {
    if (value === '') {
      return SearchType.Empty
    }
    if (value.startsWith('ckb') || value.startsWith('ckt')) {
      return SearchType.Address
    }
    if (value.startsWith('0x')) {
      return SearchType.TxHash
    }
    // like '2019-02-09'
    if (value.match(/\d{4}-\d{2}-\d{2}/)) {
      return SearchType.Date
    }
    if (value.match(/^(\d+|-\d+)$/)) {
      return SearchType.Amount
    }
    return SearchType.Unknown
  }

  // only deal with address / txHash / Date
  private static searchSQL = async (params: TransactionsByLockHashesParam, type: SearchType, value: string = '') => {
    const base = [
      '(input.lockHash in (:...lockHashes) OR output.lockHash in (:...lockHashes))',
      { lockHashes: params.lockHashes },
    ]
    if (type === SearchType.Empty) {
      return base
    }
    if (type === SearchType.Address) {
      const lockHashes: string[] = await LockUtils.addressToAllLockHashes(value)
      return ['input.lockHash IN (:...lockHashes) OR output.lockHash IN (:...lockHashes)', { lockHashes }]
    }
    if (type === SearchType.TxHash) {
      return [`${base[0]} AND tx.hash = :hash`, { lockHashes: params.lockHashes, hash: value }]
    }
    if (type === SearchType.Date) {
      const beginTimestamp = +new Date(value)
      const endTimestamp = beginTimestamp + 86400000 // 24 * 60 * 60 * 1000
      return [
        `${
          base[0]
        } AND (CAST(ifnull("tx"."timestamp", "tx"."createdAt") AS UNSIGNED BIG INT) >= :beginTimestamp AND CAST(ifnull("tx"."timestamp", "tx"."createdAt") AS UNSIGNED BIG INT) < :endTimestamp)`,
        {
          lockHashes: params.lockHashes,
          beginTimestamp,
          endTimestamp,
        },
      ]
    }
    return base
  }

  public static searchByAmount = async (params: TransactionsByLockHashesParam, amount: string) => {
    // 1. get all transactions
    const result = await TransactionsService.getAll({
      pageNo: 1,
      pageSize: 100,
      lockHashes: params.lockHashes,
    })

    let transactions = result.items
    if (result.totalCount > 100) {
      transactions = (await TransactionsService.getAll({
        pageNo: 1,
        pageSize: result.totalCount,
        lockHashes: params.lockHashes,
      })).items
    }
    // 2. filter by value
    const txs = transactions.filter(tx => tx.value === amount)
    const skip = (params.pageNo - 1) * params.pageSize
    return {
      totalCount: txs.length || 0,
      items: txs.slice(skip, skip + params.pageSize),
    }
  }

  public static getAll = async (
    params: TransactionsByLockHashesParam,
    searchValue: string = ''
  ): Promise<PaginationResult<Transaction>> => {
    const skip = (params.pageNo - 1) * params.pageSize

    const type = TransactionsService.filterSearchType(searchValue)
    if (type === SearchType.Amount) {
      return TransactionsService.searchByAmount(params, searchValue)
    }
    if (type === SearchType.Unknown) {
      return {
        totalCount: 0,
        items: [],
      }
    }
    const searchParams = await TransactionsService.searchSQL(params, type, searchValue)

    const query = getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .addSelect(`ifnull('tx'.timestamp, 'tx'.createdAt)`, 'tt')
      .leftJoinAndSelect('tx.inputs', 'input')
      .leftJoinAndSelect('tx.outputs', 'output')
      .where(searchParams[0], searchParams[1] as ObjectLiteral)
      .orderBy(`tt`, 'DESC')

    const totalCount: number = await query.getCount()

    const transactions: TransactionEntity[] = await query
      .skip(skip)
      .take(params.pageSize)
      .getMany()

    const txs: Transaction[] = transactions!.map(tx => {
      const outputCapacities: bigint = tx.outputs
        .filter(o => params.lockHashes.includes(o.lockHash))
        .map(o => BigInt(o.capacity))
        .reduce((result, c) => result + c, BigInt(0))
      const inputCapacities: bigint = tx.inputs
        .filter(i => {
          if (i.lockHash) {
            return params.lockHashes.includes(i.lockHash)
          }
          return false
        })
        .map(i => BigInt(i.capacity))
        .reduce((result, c) => result + c, BigInt(0))
      const value: bigint = outputCapacities - inputCapacities
      return {
        timestamp: tx.timestamp,
        value: value.toString(),
        hash: tx.hash,
        version: tx.version,
        type: value > BigInt(0) ? 'receive' : 'send',
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      }
    })

    return {
      totalCount: totalCount || 0,
      items: txs,
    }
  }

  public static getAllByAddresses = async (
    params: TransactionsByAddressesParam,
    searchValue: string = ''
  ): Promise<PaginationResult<Transaction>> => {
    const lockHashes: string[] = await LockUtils.addressesToAllLockHashes(params.addresses)

    return TransactionsService.getAll(
      {
        pageNo: params.pageNo,
        pageSize: params.pageSize,
        lockHashes,
      },
      searchValue
    )
  }

  public static getAllByPubkeys = async (
    params: TransactionsByPubkeysParams,
    searchValue: string = ''
  ): Promise<PaginationResult<Transaction>> => {
    const addresses: string[] = params.pubkeys.map(pubkey => {
      const addr = pubkeyToAddress(pubkey)
      return addr
    })

    const lockHashes = await LockUtils.addressesToAllLockHashes(addresses)

    return TransactionsService.getAll(
      {
        pageNo: params.pageNo,
        pageSize: params.pageSize,
        lockHashes,
      },
      searchValue
    )
  }

  public static get = async (hash: string): Promise<Transaction | undefined> => {
    const tx = await getConnection()
      .getRepository(TransactionEntity)
      .findOne(hash, { relations: ['inputs', 'outputs'] })

    if (!tx) {
      return undefined
    }

    const transaction: Transaction = tx.toInterface()

    return transaction
  }

  public static blake160sOfTx = (tx: TransactionWithoutHash | Transaction) => {
    let inputBlake160s: string[] = []
    let outputBlake160s: string[] = []
    if (tx.inputs) {
      inputBlake160s = tx.inputs
        .map(input => input.lock && input.lock.args && input.lock.args[0])
        .filter(blake160 => blake160) as string[]
    }
    if (tx.outputs) {
      outputBlake160s = tx.outputs.map(output => output.lock.args![0])
    }
    return [...new Set(inputBlake160s.concat(outputBlake160s))]
  }

  // tx count with one lockHash and status
  public static getCountByLockHashesAndStatus = async (
    lockHashes: string[],
    status: TransactionStatus[]
  ): Promise<number> => {
    const count: number = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.inputs', 'input')
      .leftJoinAndSelect('tx.outputs', 'output')
      .where(
        `(input.lockHash IN (:...lockHashes) OR output.lockHash IN (:...lockHashes)) AND tx.status IN (:...status)`,
        {
          lockHashes,
          status,
        }
      )
      .getCount()

    return count
  }

  public static getCountByAddressAndStatus = async (address: string, status: TransactionStatus[]): Promise<number> => {
    const lockHashes: string[] = await LockUtils.addressToAllLockHashes(address)
    return TransactionsService.getCountByLockHashesAndStatus(lockHashes, status)
  }

  public static updateDescription = async (hash: string, description: string) => {
    const transactionEntity = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .where({
        hash,
      })
      .getOne()

    if (!transactionEntity) {
      return undefined
    }
    transactionEntity.description = description
    return getConnection().manager.save(transactionEntity)
  }
}

export default TransactionsService
