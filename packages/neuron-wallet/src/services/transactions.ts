import { getConnection } from 'typeorm'
import { ReplaySubject } from 'rxjs'
import { OutPoint, Script, Transaction, TransactionWithoutHash, Input, Cell } from '../app-types/types'
import CellsService from './cells'
import InputEntity from '../entities/input'
import OutputEntity from '../entities/output'
import TransactionEntity from '../entities/transaction'
import NodeService from './node'
import LockUtils from '../utils/lock-utils'

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

enum OutputStatus {
  Sent = 'sent',
  Live = 'live',
  Pending = 'pending',
  Dead = 'dead',
}

/* eslint @typescript-eslint/no-unused-vars: "warn" */
/* eslint no-await-in-loop: "off" */
/* eslint no-restricted-syntax: "off" */
export default class TransactionsService {
  public static txSentSubject = new ReplaySubject<{ transaction: TransactionWithoutHash; txHash: string }>(100)

  public static getAll = async (params: TransactionsByLockHashesParam): Promise<PaginationResult<Transaction>> => {
    const skip = (params.pageNo - 1) * params.pageSize

    const query = getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.inputs', 'input')
      .leftJoinAndSelect('tx.outputs', 'output')
      .where('input.lockHash in (:...lockHashes) OR output.lockHash in (:...lockHashes)', {
        lockHashes: params.lockHashes,
      })

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
      }
    })

    return {
      totalCount: totalCount || 0,
      items: txs,
    }
  }

  public static getAllByAddresses = async (
    params: TransactionsByAddressesParam
  ): Promise<PaginationResult<Transaction>> => {
    const lockHashes: string[] = await Promise.all(
      params.addresses.map(async addr => {
        const lockHash: string = await LockUtils.addressToLockHash(addr)
        return lockHash
      })
    )

    return TransactionsService.getAll({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      lockHashes,
    })
  }

  public static getAllByPubkeys = async (
    params: TransactionsByPubkeysParams
  ): Promise<PaginationResult<Transaction>> => {
    const lockHashes: string[] = await Promise.all(
      params.pubkeys.map(async pubkey => {
        const addr = core.utils.pubkeyToAddress(pubkey)
        const lockHash = await LockUtils.addressToLockHash(addr)
        return lockHash
      })
    )

    return TransactionsService.getAll({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      lockHashes,
    })
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

  // check whether the address has history transactions
  public static hasTransactions = async (address: string): Promise<boolean> => {
    const blake160 = core.utils.parseAddress(address, core.utils.AddressPrefix.Testnet, 'hex') as string
    const contractInfo = await LockUtils.systemScript()

    const lock: Script = {
      codeHash: contractInfo.codeHash,
      args: [blake160],
    }
    const lockHash: string = LockUtils.lockScriptToHash(lock)

    const output: OutputEntity | undefined = await getConnection()
      .getRepository(OutputEntity)
      .findOne({
        where: { lockHash },
      })

    if (output) {
      return true
    }
    return false
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

      // should update timestamp / blockNumber / blockHash
      txEntity.timestamp = transaction.timestamp
      txEntity.blockHash = transaction.blockHash
      txEntity.blockNumber = transaction.blockNumber
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

  // delete transaction and it's inputs and outputs
  public static deleteByBlockNumbers = async (blockNumbers: string[]) => {
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(TransactionEntity)
      .where('blockNumber in (:...blockNumbers)', {
        blockNumbers,
      })
      .execute()
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

    const { inputs, capacities } = await CellsService.gatherInputs(needCapacities.toString(), lockHashes)

    const outputs: Cell[] = targetOutputs.map(o => {
      const { capacity, address } = o

      const blake160: string = LockUtils.addressToBlake160(address)

      const output: Cell = {
        capacity,
        data: '0x',
        lock: {
          codeHash,
          args: [blake160],
        },
      }

      return output
    })

    // change
    if (BigInt(capacities) > needCapacities + BigInt(fee)) {
      const changeBlake160: string = LockUtils.addressToBlake160(changeAddress)

      const output: Cell = {
        capacity: `${BigInt(capacities) - needCapacities - BigInt(fee)}`,
        data: '0x',
        lock: {
          codeHash,
          args: [changeBlake160],
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

  // tx count with one lockHash
  public static getCountByLockHash = async (lockHash: string): Promise<number> => {
    const outputs: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where(`output.lockHash = :lockHash`, { lockHash })
      .select('DISTINCT output.outPointTxHash', 'outPointTxHash')
      .getRawMany()

    const outputTxHashes: string[] = outputs.map(output => output.outPointTxHash)

    const inputs: InputEntity[] = await getConnection()
      .getRepository(InputEntity)
      .createQueryBuilder('input')
      .where(`input.lockHash = :lockHash`, { lockHash })
      .select(`DISTINCT input.transactionHash`, 'transactionHash')
      .getRawMany()

    const inputTxHashes: string[] = inputs.map((input: any) => input.transactionHash)

    const hashes: string[] = [...new Set(outputTxHashes.concat(inputTxHashes))]

    const count: number = hashes.length

    return count
  }

  public static getCountByAddress = async (address: string): Promise<number> => {
    const lockHash: string = await LockUtils.addressToLockHash(address)
    return TransactionsService.getCountByLockHash(lockHash)
  }
}

// listen to send tx event
TransactionsService.txSentSubject.subscribe(msg => {
  TransactionsService.saveSentTx(msg.transaction, msg.txHash)
})
