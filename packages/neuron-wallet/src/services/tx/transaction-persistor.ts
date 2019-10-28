import { getConnection, QueryRunner, Not} from 'typeorm'
import { OutPoint, Transaction, TransactionWithoutHash, TransactionStatus } from 'types/cell-types'
import InputEntity from 'database/chain/entities/input'
import OutputEntity from 'database/chain/entities/output'
import TransactionEntity from 'database/chain/entities/transaction'
import LockUtils from 'models/lock-utils'
import { OutputStatus, TxSaveType } from './params'
import Utils from 'services/sync/utils'

export class TransactionPersistor {
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
    return TransactionPersistor.create(transaction, OutputStatus.Sent, OutputStatus.Pending)
  }

  // After the tx is fetched:
  // 1. If the tx is not persisted before fetching, output = live, input = dead
  // 2. If the tx is already persisted before fetching, output = live, input = dead
  public static saveWithFetch = async (transaction: Transaction): Promise<TransactionEntity> => {
    const connection = getConnection()
    const txEntity: TransactionEntity | undefined = await connection
      .getRepository(TransactionEntity)
      .findOne(transaction.hash)

    // return if success
    if (txEntity && txEntity.status === TransactionStatus.Success) {
      return txEntity
    }

    if (txEntity) {
      // lazy load inputs / outputs
      const inputEntities = await connection
        .getRepository(InputEntity)
        .createQueryBuilder('input')
        .where({
          transaction: txEntity,
        })
        .getMany()

      const outputEntities = await connection
        .getRepository(OutputEntity)
        .createQueryBuilder('output')
        .where({
          transaction: txEntity,
        })
        .getMany()

      // input -> previousOutput => dead
      // output => live
      const outputs: OutputEntity[] = await Promise.all(
        outputEntities.map(async o => {
          const output = o
          output.status = OutputStatus.Live
          return output
        })
      )

      const previousOutputsWithUndefined: Array<OutputEntity | undefined> = await Promise.all(
        inputEntities.map(async input => {
          const outPoint: OutPoint | null = input.previousOutput()

          if (outPoint) {
            const outputEntity: OutputEntity | undefined = await connection.getRepository(OutputEntity).findOne({
              outPointTxHash: outPoint.txHash,
              outPointIndex: outPoint.index,
              status: Not(OutputStatus.Dead),
            })
            if (outputEntity) {
              outputEntity.status = OutputStatus.Dead
              // only need to update when outputEntity status changed
              return outputEntity
            }
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

    return TransactionPersistor.create(transaction, OutputStatus.Live, OutputStatus.Dead)
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
    tx.headerDeps = transaction.headerDeps!
    tx.cellDeps = transaction.cellDeps!
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
      const outPoint = i.previousOutput
      if (outPoint) {
        input.outPointTxHash = outPoint.txHash
        input.outPointIndex = outPoint.index
      }
      input.transaction = tx
      input.capacity = i.capacity || null
      input.lockHash = i.lockHash || null
      input.lock = i.lock || null
      input.since = i.since!
      inputs.push(input)

      if (outPoint) {
        const previousOutput: OutputEntity | undefined = await connection.getRepository(OutputEntity).findOne({
          outPointTxHash: outPoint.txHash,
          outPointIndex: outPoint.index,
          status: Not(inputStatus),
        })

        if (previousOutput) {
          // update previousOutput status here
          previousOutput.status = inputStatus
          previousOutputs.push(previousOutput)
        }
      }
    }

    const outputsData = transaction.outputsData!
    const outputs: OutputEntity[] = transaction.outputs!.map((o, index) => {
      const output = new OutputEntity()
      output.outPointTxHash = transaction.hash
      output.outPointIndex = index.toString()
      output.capacity = o.capacity
      output.lock = o.lock
      output.lockHash = o.lockHash!
      output.transaction = tx
      output.status = outputStatus
      if (o.type) {
        output.typeScript = o.type
      }
      const data = outputsData[index]
      if (data && data !== '0x') {
        output.hasData = true
      } else {
        output.hasData = false
      }
      return output
    })

    const sliceSize = 100
    const queryRunner = connection.createQueryRunner()
    await TransactionPersistor.waitUntilTransactionFinished(queryRunner)
    await queryRunner.startTransaction()
    try {
      await queryRunner.manager.save(tx)
      for (const slice of Utils.eachSlice(inputs, sliceSize)) {
        await queryRunner.manager.save(slice)
      }
      for (const slice of Utils.eachSlice(previousOutputs, sliceSize)) {
        await queryRunner.manager.save(slice)
      }
      for (const slice of Utils.eachSlice(outputs, sliceSize)) {
        await queryRunner.manager.save(slice)
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction()
    } finally {
      await queryRunner.release()
    }
    tx.inputs = inputs
    tx.outputs = outputs
    return tx
  }

  private static waitUntilTransactionFinished = async(queryRunner: QueryRunner, timeout: number = 5000) => {
    const startAt: number = +new Date()
    while (queryRunner.isTransactionActive) {
      const now: number = +new Date()
      if (now - startAt < timeout) {
        await Utils.sleep(50)
      }
    }
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
      if (!output.lockHash) {
        output.lockHash = LockUtils.lockScriptToHash(output.lock!)
      }
      return output
    })

    let txEntity: TransactionEntity
    if (saveType === TxSaveType.Sent) {
      txEntity = await TransactionPersistor.saveWithSent(tx)
    } else if (saveType === TxSaveType.Fetch) {
      txEntity = await TransactionPersistor.saveWithFetch(tx)
    } else {
      throw new Error('Error TxSaveType!')
    }
    return txEntity
  }

  public static saveFetchTx = async (transaction: Transaction): Promise<TransactionEntity> => {
    const txEntity: TransactionEntity = await TransactionPersistor.convertTransactionAndSave(
      transaction,
      TxSaveType.Fetch
    )
    return txEntity
  }

  public static get = async (txHash: string) => {
    return await getConnection().getRepository(TransactionEntity)
      .findOne(txHash, { relations: ['inputs'] })
  }

  public static saveSentTx = async (
    transaction: TransactionWithoutHash,
    txHash: string
  ): Promise<TransactionEntity> => {
    const tx: Transaction = {
      hash: txHash,
      ...transaction,
    }
    const txEntity: TransactionEntity = await TransactionPersistor.convertTransactionAndSave(tx, TxSaveType.Sent)
    return txEntity
  }
}

export default TransactionPersistor
