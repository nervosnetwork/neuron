import { getConnection, ObjectLiteral } from 'typeorm'
import { pubkeyToAddress } from '@nervosnetwork/ckb-sdk-utils'
import TransactionEntity from 'database/chain/entities/transaction'
import LockUtils from 'models/lock-utils'
import { CONNECTION_NOT_FOUND_NAME } from 'database/chain/ormconfig'
import NodeService from 'services/node'
import OutputEntity from 'database/chain/entities/output'
import Transaction, { TransactionStatus } from 'models/chain/transaction'

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
      const lockHashes = new LockUtils(await LockUtils.systemScript()).addressToAllLockHashes(value)
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
        } AND (CAST("tx"."timestamp" AS UNSIGNED BIG INT) >= :beginTimestamp AND CAST("tx"."timestamp" AS UNSIGNED BIG INT) < :endTimestamp)`,
        {
          lockHashes: params.lockHashes,
          beginTimestamp,
          endTimestamp,
        },
      ]
    }
    return base
  }

  /// TODO: Decide if this should be supported.
  /// For now just return empty results.
  /// The second query (one after `if (result.totalCount > 100) {` will mostly cuase `SQLITE_ERROR: too many SQL variables` error.
  public static searchByAmount = async (_params: TransactionsByLockHashesParam, _amount: string) => {
    return {
      totalCount: 0,
      items: []
    }
    /*
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
    }*/
  }

  public static getAll = async (
    params: TransactionsByLockHashesParam,
    searchValue: string = ''
  ): Promise<PaginationResult<Transaction>> => {
    try {
      // if connection not found, which means no database to connect
      // it happened when no node connected and no previous database found.
      getConnection()
    } catch (err) {
      if (err.name === CONNECTION_NOT_FOUND_NAME) {
        return {
          totalCount: 0,
          items: [],
        }
      }
      throw err
    }

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
      .leftJoinAndSelect('tx.inputs', 'input')
      .leftJoinAndSelect('tx.outputs', 'output')
      .where(searchParams[0], searchParams[1] as ObjectLiteral)

    const totalCount: number = await query.getCount()

    const transactions: TransactionEntity[] = await query
      .orderBy(`tx.timestamp`, 'DESC')
      .skip(skip)
      .take(params.pageSize)
      .getMany()

    const inputPreviousTxHashes: string[] = transactions
      .map(tx => tx.inputs)
      .reduce((acc, val) => acc.concat(val), [])
      .map(i => i.outPointTxHash)
      .filter(h => !!h) as string[]

    const daoCellOutPoints: { txHash: string, index: string }[] = (await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .select("output.outPointTxHash", "txHash")
      .addSelect("output.outPointIndex", "index")
      .where('output.daoData IS NOT NULL')
      .getRawMany())
      .filter(o => inputPreviousTxHashes.includes(o.txHash))

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
        .map(i => BigInt(i.capacity || 0))
        .reduce((result, c) => result + c, BigInt(0))
      const value: bigint = outputCapacities - inputCapacities

      let nervosDao: boolean = false
      if (
        tx.outputs.some(o => !!o.daoData) ||
        tx.inputs.some(i => daoCellOutPoints.some(dc => {
          return dc.txHash === i.outPointTxHash && dc.index === i.outPointIndex
        }))
      ) {
        nervosDao = true
      }
      return Transaction.fromObject({
        timestamp: tx.timestamp,
        value: value.toString(),
        hash: tx.hash,
        version: tx.version,
        type: value > BigInt(0) ? 'receive' : 'send',
        nervosDao,
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        blockNumber: tx.blockNumber,
      })
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
    const lockHashes: string[] = new LockUtils(await LockUtils.systemScript())
      .addressesToAllLockHashes(params.addresses)

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

    const lockHashes = new LockUtils(await LockUtils.systemScript()).addressesToAllLockHashes(addresses)

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
    try {
      // if connection not found, may means no database to connect
      // it happened when no node connected and no previous database found.
      getConnection()
    } catch (err) {
      if (err.name === CONNECTION_NOT_FOUND_NAME) {
        return undefined
      }
      throw err
    }

    const tx = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('transaction')
      .where('transaction.hash is :hash', {hash})
      .leftJoinAndSelect('transaction.inputs', 'input')
      .leftJoinAndSelect('transaction.outputs', 'output')
      .orderBy({
        'input.id': "ASC"
      })
      .getOne()

    if (!tx) {
      return undefined
    }

    const transaction: Transaction = tx.toModel()

    return transaction
  }

  public static blake160sOfTx = (tx: Transaction) => {
    let inputBlake160s: string[] = []
    let outputBlake160s: string[] = []
    if (tx.inputs) {
      inputBlake160s = tx.inputs
        .map(input => input.lock && input.lock.args)
        .filter(blake160 => blake160) as string[]
    }
    if (tx.outputs) {
      outputBlake160s = tx.outputs.map(output => output.lock.args!)
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
      .where(
        `tx.hash in (select output.transactionHash from output where output.lockHash in (:...lockHashes) union select input.transactionHash from input where input.lockHash in (:...lockHashes)) AND tx.status IN (:...status)`,
        {
          lockHashes,
          status,
        }
      )
      .getCount()

    return count
  }

  public static getCountByAddressAndStatus = async (
    address: string,
    status: TransactionStatus[],
    url: string = NodeService.getInstance().core.rpc.node.url
  ): Promise<number> => {
    const lockHashes: string[] = new LockUtils(await LockUtils.systemScript(url)).addressToAllLockHashes(address)
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
