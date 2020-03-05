import { getConnection, ObjectLiteral } from 'typeorm'
import { pubkeyToAddress } from '@nervosnetwork/ckb-sdk-utils'
import TransactionEntity from 'database/chain/entities/transaction'
import LockUtils from 'models/lock-utils'
import OutputEntity from 'database/chain/entities/output'
import Transaction, { TransactionStatus } from 'models/chain/transaction'
import InputEntity from 'database/chain/entities/input'

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
  Empty = 'empty',
  Unknown = 'unknown',
}

export class TransactionsService {
  public static filterSearchType(value: string) {
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
      // Amount search is not supported
    }
    return SearchType.Unknown
  }

  public static async getAll(params: TransactionsByLockHashesParam, searchValue: string = ''): Promise<PaginationResult<Transaction>> {
    const type = TransactionsService.filterSearchType(searchValue)
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
      .skip((params.pageNo - 1) * params.pageSize)
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

  public static async getAllByAddresses(params: TransactionsByAddressesParam, searchValue: string = ''): Promise<PaginationResult<Transaction>> {
    const type: SearchType = TransactionsService.filterSearchType(searchValue)
    if (type === SearchType.Unknown) {
      return {
        totalCount: 0,
        items: []
      }
    }

    let lockHashes: string[] = new LockUtils().addressesToAllLockHashes(params.addresses)

    if (type === SearchType.Address) {
      const hash = new LockUtils().addressToLockHash(searchValue)
      if (lockHashes.includes(hash)) {
        lockHashes = [hash]
      } else {
        return {
          totalCount: 0,
          items: []
        }
      }
    }

    const connection = getConnection()
    const repository = connection.getRepository(TransactionEntity)

    let allTxHashes: string[] = []
    if (type === SearchType.TxHash) {
      allTxHashes = [searchValue]
    } else if (type === SearchType.Date) {
      const beginTimestamp = +new Date(new Date(searchValue).toDateString())
      const endTimestamp = beginTimestamp + 86400000 // 24 * 60 * 60 * 1000
      allTxHashes = (await repository
        .createQueryBuilder('tx')
        .select("tx.hash", "txHash")
        .where(
          `tx.hash in (select output.transactionHash from output where output.lockHash in (:...lockHashes) union select input.transactionHash from input where input.lockHash in (:...lockHashes)) AND (CAST("tx"."timestamp" AS UNSIGNED BIG INT) >= :beginTimestamp AND CAST("tx"."timestamp" AS UNSIGNED BIG INT) < :endTimestamp)`,
          { lockHashes, beginTimestamp, endTimestamp }
        )
        .orderBy('tx.timestamp', 'DESC')
        .getRawMany())
        .map(tx => tx.txHash)
    } else {
      allTxHashes = (await repository
        .createQueryBuilder('tx')
        .select("tx.hash", "txHash")
        .where(
          `tx.hash in (select output.transactionHash from output where output.lockHash in (:...lockHashes) union select input.transactionHash from input where input.lockHash in (:...lockHashes))`,
          { lockHashes }
        )
        .orderBy('tx.timestamp', 'DESC')
        .getRawMany())
        .map(tx => tx.txHash)
    }

    const skip = (params.pageNo - 1) * params.pageSize
    const txHashes = allTxHashes.slice(skip, skip + params.pageSize)

    const totalCount: number = allTxHashes.length

    const transactions = await connection
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .where('tx.hash IN (:...txHashes)', { txHashes })
      .orderBy(`tx.timestamp`, 'DESC')
      .getMany()

    const inputs = await connection
      .getRepository(InputEntity)
      .createQueryBuilder('input')
      .select('input.capacity', 'capacity')
      .addSelect('input.transactionHash', 'transactionHash')
      .addSelect('input.outPointTxHash', 'outPointTxHash')
      .addSelect('input.outPointIndex', 'outPointIndex')
      .where(`input.transactionHash IN (:...txHashes) AND input.lockHash in (:...lockHashes)`, { txHashes, lockHashes })
      .getRawMany()

    const outputs = await connection
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .select('output.capacity', 'capacity')
      .addSelect('output.transactionHash', 'transactionHash')
      .addSelect('output.daoData', 'daoData')
      .where(`output.transactionHash IN (:...txHashes) AND output.lockHash IN (:...lockHashes)`, { txHashes, lockHashes })
      .getRawMany()

    const inputPreviousTxHashes: string[] = inputs
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

    const sums = new Map<string, bigint>()
    const daoFlag = new Map<string, boolean>()
    outputs.map(o => {
      const s = sums.get(o.transactionHash) || BigInt(0)
      sums.set(o.transactionHash, s + BigInt(o.capacity))

      if (o.daoData) {
        daoFlag.set(o.transactionHash, true)
      }
    })

    inputs.map(i => {
      const s = sums.get(i.transactionHash) || BigInt(0)
      sums.set(i.transactionHash, s - BigInt(i.capacity))

      const result = daoCellOutPoints.some(dc => {
        return dc.txHash === i.outPointTxHash && dc.index === i.outPointIndex
      })
      if (result) {
        daoFlag.set(i.transactionHash, true)
      }
    })

    const txs = transactions.map(tx => {
      const value = sums.get(tx.hash!) || BigInt(0)
      return Transaction.fromObject({
        timestamp: tx.timestamp,
        value: value.toString(),
        hash: tx.hash,
        version: tx.version,
        type: value > BigInt(0) ? 'receive' : 'send',
        nervosDao: daoFlag.get(tx.hash!),
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        blockNumber: tx.blockNumber,
      })
    })

    return {
      totalCount,
      items: txs,
    }
  }

  public static async getAllByPubkeys(params: TransactionsByPubkeysParams, searchValue: string = ''): Promise<PaginationResult<Transaction>> {
    const addresses: string[] = params.pubkeys.map(pubkey => {
      return pubkeyToAddress(pubkey)
    })
    const lockHashes = new LockUtils().addressesToAllLockHashes(addresses)

    return TransactionsService.getAll(
      {
        pageNo: params.pageNo,
        pageSize: params.pageSize,
        lockHashes,
      },
      searchValue
    )
  }

  public static async get(hash: string): Promise<Transaction | undefined> {
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

    return tx.toModel()
  }

  public static blake160sOfTx(tx: Transaction) {
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
  public static async getCountByLockHashesAndStatus(lockHashes: string[], status: TransactionStatus[]): Promise<number> {
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

  public static async getCountByAddressAndStatus(
    address: string,
    status: TransactionStatus[]
  ): Promise<number> {
    const lockHashes: string[] = [new LockUtils().addressToLockHash(address)]
    return TransactionsService.getCountByLockHashesAndStatus(lockHashes, status)
  }

  public static async updateDescription(hash: string, description: string) {
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

  // only deal with address / txHash / Date
  private static async searchSQL(params: TransactionsByLockHashesParam, type: SearchType, value: string = '') {
    const base = [
      '(input.lockHash in (:...lockHashes) OR output.lockHash in (:...lockHashes))',
      { lockHashes: params.lockHashes },
    ]
    if (type === SearchType.Empty) {
      return base
    }
    if (type === SearchType.Address) {
      const lockHash: string = new LockUtils().addressToLockHash(value)
      return ['input.lockHash = :lockHash OR output.lockHash = :lockHash', { lockHash }]
    }
    if (type === SearchType.TxHash) {
      return [`${base[0]} AND tx.hash = :hash`, { lockHashes: params.lockHashes, hash: value }]
    }
    if (type === SearchType.Date) {
      const beginTimestamp = +new Date(new Date(value).toDateString())
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
}

export default TransactionsService
