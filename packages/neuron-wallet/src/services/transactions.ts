import { getConnection, In, ObjectLiteral } from 'typeorm'
import {
  OutPoint,
  Transaction,
  TransactionWithoutHash,
  Input,
  Cell,
  TransactionStatus,
  ScriptHashType,
} from '../types/cell-types'
import CellsService, { MIN_CELL_CAPACITY } from './cells'
import InputEntity from '../database/chain/entities/input'
import OutputEntity from '../database/chain/entities/output'
import TransactionEntity from '../database/chain/entities/transaction'
import NodeService from './node'
import LockUtils from '../models/lock-utils'
import { CapacityTooSmall } from '../exceptions'

const { core } = NodeService.getInstance()

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

export interface TargetOutput {
  address: string
  capacity: string
}

enum TxSaveType {
  Sent = 'sent',
  Fetch = 'fetch',
}

export enum OutputStatus {
  Sent = 'sent',
  Live = 'live',
  Pending = 'pending',
  Dead = 'dead',
  Failed = 'failed',
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
export default class TransactionsService {
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
      const addr = core.utils.pubkeyToAddress(pubkey)
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

  // After the tx is sent:
  // 1. If the tx is not persisted before sending, output = sent, input = pending
  // 2. If the tx is already persisted before sending, do nothing
  public static saveWithSent = async (transaction: Transaction): Promise<TransactionEntity> => {
    const txEntity: TransactionEntity | undefined = await getConnection()
      .getRepository(TransactionEntity)
      .findOne(transaction.hash)

    if (txEntity) {
      // nothing to do if exists already
      return txEntity
    }
    return TransactionsService.create(transaction, OutputStatus.Sent, OutputStatus.Pending)
  }

  // After the tx is fetched:
  // 1. If the tx is not persisted before fetching, output = live, input = dead
  // 2. If the tx is already persisted before fetching, output = live, input = dead
  public static saveWithFetch = async (transaction: Transaction): Promise<TransactionEntity> => {
    const connection = getConnection()
    const txEntity: TransactionEntity | undefined = await connection
      .getRepository(TransactionEntity)
      .findOne(transaction.hash, { relations: ['inputs', 'outputs'] })

    // return if success
    if (txEntity && txEntity.status === TransactionStatus.Success) {
      return txEntity
    }

    if (txEntity) {
      // input -> previousOutput => dead
      // output => live
      const outputs: OutputEntity[] = await Promise.all(
        txEntity.outputs.map(async o => {
          const output = o
          output.status = OutputStatus.Live
          return output
        })
      )

      const previousOutputsWithUndefined: Array<OutputEntity | undefined> = await Promise.all(
        txEntity.inputs.map(async input => {
          const outPoint: OutPoint = input.previousOutput()
          const { cell } = outPoint

          if (cell) {
            const outputEntity: OutputEntity | undefined = await connection.getRepository(OutputEntity).findOne({
              outPointTxHash: cell.txHash,
              outPointIndex: cell.index,
            })
            if (outputEntity) {
              outputEntity.status = OutputStatus.Dead
            }
            return outputEntity
          }
          return undefined
        })
      )

      const previousOutputs: OutputEntity[] = previousOutputsWithUndefined.filter(o => !!o) as OutputEntity[]

      // should update timestamp / blockNumber / blockHash / status
      txEntity.timestamp = transaction.timestamp
      txEntity.blockHash = transaction.blockHash
      txEntity.blockNumber = transaction.blockNumber
      txEntity.status = TransactionStatus.Success
      await connection.manager.save([txEntity, ...outputs.concat(previousOutputs)])

      return txEntity
    }

    return TransactionsService.create(transaction, OutputStatus.Live, OutputStatus.Dead)
  }

  // only create, check exist before this
  public static create = async (
    transaction: Transaction,
    outputStatus: OutputStatus,
    inputStatus: OutputStatus
  ): Promise<TransactionEntity> => {
    const connection = getConnection()
    const tx = new TransactionEntity()
    tx.hash = transaction.hash
    tx.version = transaction.version
    tx.deps = transaction.deps!
    tx.timestamp = transaction.timestamp!
    tx.blockHash = transaction.blockHash!
    tx.blockNumber = transaction.blockNumber!
    tx.witnesses = transaction.witnesses!
    tx.description = transaction.description
    // update tx status here
    tx.status = outputStatus === OutputStatus.Sent ? TransactionStatus.Pending : TransactionStatus.Success
    tx.inputs = []
    tx.outputs = []
    const inputs: InputEntity[] = []
    const previousOutputs: OutputEntity[] = []
    for (const i of transaction.inputs!) {
      const input = new InputEntity()
      const { cell } = i.previousOutput
      if (cell) {
        input.outPointTxHash = cell.txHash
        input.outPointIndex = cell.index
      }
      input.transaction = tx
      input.capacity = i.capacity || null
      input.lockHash = i.lockHash || null
      input.since = i.since!
      inputs.push(input)

      if (cell) {
        const previousOutput: OutputEntity | undefined = await connection.getRepository(OutputEntity).findOne({
          outPointTxHash: input.previousOutput().cell!.txHash,
          outPointIndex: input.previousOutput().cell!.index,
        })

        if (previousOutput) {
          // update previousOutput status here
          previousOutput.status = inputStatus
          previousOutputs.push(previousOutput)
        }
      }
    }

    const outputs: OutputEntity[] = await Promise.all(
      transaction.outputs!.map(async (o, index) => {
        const output = new OutputEntity()
        output.outPointTxHash = transaction.hash
        output.outPointIndex = index.toString()
        output.capacity = o.capacity
        output.lock = o.lock
        output.lockHash = o.lockHash!
        output.transaction = tx
        output.status = outputStatus
        return output
      })
    )

    await connection.manager.save([tx, ...inputs, ...previousOutputs, ...outputs])
    return tx
  }

  public static deleteWhenFork = async (blockNumber: string) => {
    const txs = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .where(
        'CAST(tx.blockNumber AS UNSIGNED BIG INT) > CAST(:blockNumber AS UNSIGNED BIG INT) AND tx.status = :status',
        {
          blockNumber,
          status: TransactionStatus.Success,
        }
      )
      .getMany()
    return getConnection().manager.remove(txs)
  }

  // update previousOutput's status to 'dead' if found
  // calculate output lockHash, input lockHash and capacity
  // when send a transaction, use TxSaveType.Sent
  // when fetch a transaction, use TxSaveType.Fetch
  public static convertTransactionAndSave = async (
    transaction: Transaction,
    saveType: TxSaveType
  ): Promise<TransactionEntity> => {
    const tx: Transaction = transaction
    tx.outputs = tx.outputs!.map(o => {
      const output = o
      output.lockHash = LockUtils.lockScriptToHash(output.lock!)
      return output
    })

    tx.inputs = await Promise.all(
      tx.inputs!.map(async i => {
        const input: Input = i
        const { cell } = i.previousOutput

        if (cell) {
          const outputEntity: OutputEntity | undefined = await getConnection()
            .getRepository(OutputEntity)
            .findOne({
              outPointTxHash: cell.txHash,
              outPointIndex: cell.index,
            })
          if (outputEntity) {
            input.capacity = outputEntity.capacity
            input.lockHash = outputEntity.lockHash
          }
        }
        return input
      })
    )
    let txEntity: TransactionEntity
    if (saveType === TxSaveType.Sent) {
      txEntity = await TransactionsService.saveWithSent(transaction)
    } else if (saveType === TxSaveType.Fetch) {
      txEntity = await TransactionsService.saveWithFetch(transaction)
    } else {
      throw new Error('Error TxSaveType!')
    }
    return txEntity
  }

  public static saveFetchTx = async (transaction: Transaction): Promise<TransactionEntity> => {
    const txEntity: TransactionEntity = await TransactionsService.convertTransactionAndSave(
      transaction,
      TxSaveType.Fetch
    )
    return txEntity
  }

  public static saveSentTx = async (
    transaction: TransactionWithoutHash,
    txHash: string
  ): Promise<TransactionEntity> => {
    const tx: Transaction = {
      hash: txHash,
      ...transaction,
    }
    const txEntity: TransactionEntity = await TransactionsService.convertTransactionAndSave(tx, TxSaveType.Sent)
    return txEntity
  }

  // lockHashes for each inputs
  public static generateTx = async (
    lockHashes: string[],
    targetOutputs: TargetOutput[],
    changeAddress: string,
    fee: string = '0'
  ): Promise<TransactionWithoutHash> => {
    const { codeHash, outPoint } = await LockUtils.systemScript()

    const needCapacities: bigint = targetOutputs
      .map(o => BigInt(o.capacity))
      .reduce((result, c) => result + c, BigInt(0))

    const minCellCapacity = BigInt(MIN_CELL_CAPACITY)

    const outputs: Cell[] = targetOutputs.map(o => {
      const { capacity, address } = o

      if (BigInt(capacity) < minCellCapacity) {
        throw new CapacityTooSmall()
      }

      const blake160: string = LockUtils.addressToBlake160(address)

      const output: Cell = {
        capacity,
        data: '0x',
        lock: {
          codeHash,
          args: [blake160],
          hashType: ScriptHashType.Data,
        },
      }

      return output
    })

    const { inputs, capacities } = await CellsService.gatherInputs(needCapacities.toString(), lockHashes, fee)

    // change
    if (BigInt(capacities) > needCapacities + BigInt(fee)) {
      const changeBlake160: string = LockUtils.addressToBlake160(changeAddress)

      const output: Cell = {
        capacity: `${BigInt(capacities) - needCapacities - BigInt(fee)}`,
        data: '0x',
        lock: {
          codeHash,
          args: [changeBlake160],
          hashType: ScriptHashType.Data,
        },
      }

      outputs.push(output)
    }

    return {
      version: '0',
      deps: [outPoint],
      inputs,
      outputs,
      witnesses: [],
    }
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

  public static pendings = async (): Promise<TransactionEntity[]> => {
    const pendingTransactions = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .where({
        status: TransactionStatus.Pending,
      })
      .getMany()

    return pendingTransactions
  }

  // update tx status to TransactionStatus.Failed
  // update outputs status to OutputStatus.Failed
  // update previous outputs (inputs) to OutputStatus.Live
  public static updateFailedTxs = async (hashes: string[]) => {
    const txs = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.inputs', 'input')
      .leftJoinAndSelect('tx.outputs', 'output')
      .where({
        hash: In(hashes),
        status: TransactionStatus.Pending,
      })
      .getMany()

    const txToUpdate = txs.map(tx => {
      const transaction = tx
      transaction.status = TransactionStatus.Failed
      return transaction
    })
    const allOutputs = txs
      .map(tx => tx.outputs)
      .reduce((acc, val) => acc.concat(val), [])
      .map(o => {
        const output = o
        output.status = OutputStatus.Failed
        return output
      })
    const allInputs = txs.map(tx => tx.inputs).reduce((acc, val) => acc.concat(val), [])
    const previousOutputs = await Promise.all(
      allInputs.map(async input => {
        const output = await getConnection()
          .getRepository(OutputEntity)
          .createQueryBuilder('output')
          .where({
            outPointTxHash: input.outPointTxHash,
            outPointIndex: input.outPointIndex,
          })
          .getOne()
        if (output) {
          output.status = OutputStatus.Live
        }
        return output
      })
    )
    const previous = previousOutputs.filter(output => output) as OutputEntity[]
    await getConnection().manager.save([...txToUpdate, ...allOutputs, ...previous])
    const blake160s = txs.map(tx => TransactionsService.blake160sOfTx(tx.toInterface()))
    const uniqueBlake160s = [...new Set(blake160s.reduce((acc, val) => acc.concat(val), []))]
    return uniqueBlake160s
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
