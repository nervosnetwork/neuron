import { getConnection, QueryRunner } from 'typeorm'
import InputEntity from 'database/chain/entities/input'
import OutputEntity from 'database/chain/entities/output'
import TransactionEntity from 'database/chain/entities/transaction'
import ArrayUtils from 'utils/array'
import CommonUtils from 'utils/common'
import logger from 'utils/logger'
import OutPoint from 'models/chain/out-point'
import Output, { OutputStatus } from 'models/chain/output'
import Transaction, { TransactionStatus } from 'models/chain/transaction'
import Input from 'models/chain/input'

export enum TxSaveType {
  Sent = 'sent',
  Fetch = 'fetch',
}

export class TransactionPersistor {
  // After the tx is sent:
  // 1. If the tx is not persisted before sending, output = sent, input = pending
  // 2. If the tx is already persisted before sending, do nothing
  private static saveWithSent = async (transaction: Transaction): Promise<TransactionEntity> => {
    const txEntity: TransactionEntity | undefined = await getConnection()
      .getRepository(TransactionEntity)
      .findOne(transaction.hash)

    if (txEntity && txEntity.status === TransactionStatus.Failed) {
      // delete and create a new one (OR just update all status)
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(TransactionEntity)
        .where('hash = :hash', { hash: transaction.hash })
        .execute()
    } else if (txEntity) {
      // nothing to do if exists already
      return txEntity
    }
    return TransactionPersistor.create(transaction, OutputStatus.Sent, OutputStatus.Pending)
  }

  // After the tx is fetched:
  // 1. If the tx is not persisted before fetching, output = live, input = dead
  // 2. If the tx is already persisted before fetching, output = live, input = dead
  private static saveWithFetch = async (transaction: Transaction): Promise<TransactionEntity> => {
    const connection = getConnection()
    const txEntity: TransactionEntity | undefined = await connection
      .getRepository(TransactionEntity)
      .findOne(transaction.hash)

    // update multiSignBlake160 / input.type / input.data / output.data
    if (txEntity) {
      const outputsToUpdate: Output[] = transaction.outputs.filter((o, i) => !!o.multiSignBlake160 || transaction.outputsData[i].length > 2)
      const inputsToUpdate: Input[] = transaction.inputs.filter(i => !!i.multiSignBlake160 || (i.data && i.data.length > 2) || i.type)

      if (outputsToUpdate.length || inputsToUpdate.length) {
        // update multiSignBlake160Info
        // also update input which previous output in outputsToUpdate
        await getConnection().manager.transaction(async transactionalEntityManager => {
          for (const o of outputsToUpdate) {
            const data = transaction.outputsData[+o.outPoint!.index].slice(0, 130)
            await transactionalEntityManager
              .createQueryBuilder()
              .update(OutputEntity)
              .set({
                multiSignBlake160: o.multiSignBlake160,
                data,
              })
              .where({
                outPointTxHash: o.outPoint!.txHash,
                outPointIndex: o.outPoint!.index
              })
              .execute()

            await transactionalEntityManager
              .createQueryBuilder()
              .update(InputEntity)
              .set({
                multiSignBlake160: o.multiSignBlake160,
                data,
              })
              .where({
                outPointTxHash: o.outPoint!.txHash,
                outPointIndex: o.outPoint!.index
              })
              .execute()
          }

          for (const i of inputsToUpdate) {
            await transactionalEntityManager
              .createQueryBuilder()
              .update(InputEntity)
              .set({
                multiSignBlake160: i.multiSignBlake160,
                data: i.data?.slice(0, 130) || '0x',
                typeCodeHash: i.type?.codeHash,
                typeArgs: i.type?.args,
                typeHashType: i.type?.hashType,
                typeHash: i.typeHash,
              })
              .where({
                outPointTxHash: i.previousOutput!.txHash,
                outPointIndex: i.previousOutput!.index
              })
              .execute()
          }
        })
      }

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
          transaction: txEntity
        })
        .andWhere('status != :status', {status: OutputStatus.Dead})
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
            })
            if (outputEntity && outputEntity.status !== OutputStatus.Dead) {
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

      const sliceSize = 100
      const queryRunner = connection.createQueryRunner()
      await TransactionPersistor.waitUntilTransactionFinished(queryRunner)
      await queryRunner.startTransaction()
      try {
        await queryRunner.manager.save(txEntity)
        for (const slice of ArrayUtils.eachSlice(previousOutputs, sliceSize)) {
          await queryRunner.manager.save(slice)
        }
        for (const slice of ArrayUtils.eachSlice(outputs, sliceSize)) {
          await queryRunner.manager.save(slice)
        }
        await queryRunner.commitTransaction()
      } catch (err) {
        logger.error('Database:\tsaveWithFetch update error:', err)
        await queryRunner.rollbackTransaction()
        throw err
      } finally {
        await queryRunner.release()
      }

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
    tx.hash = transaction.hash || transaction.computeHash()
    tx.version = transaction.version
    tx.headerDeps = transaction.headerDeps
    tx.cellDeps = transaction.cellDeps
    tx.timestamp = transaction.timestamp!
    tx.blockHash = transaction.blockHash!
    tx.blockNumber = transaction.blockNumber!
    tx.witnesses = transaction.witnessesAsString()
    tx.description = '' // tx desc is saved in leveldb as wallet property
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
      // input.lock = i.lock || null
      if (i.lock) {
        input.lockCodeHash = i.lock.codeHash
        input.lockArgs = i.lock.args
        input.lockHashType = i.lock.hashType
      }
      if (i.type) {
        input.typeCodeHash = i.type?.codeHash
        input.typeArgs = i.type?.args
        input.typeHashType = i.type?.hashType
        input.typeHash = i.typeHash || null
      }
      if (i.data) {
        input.data = i.data.slice(0, 130)
      }
      input.since = i.since!
      input.multiSignBlake160 = i.multiSignBlake160 || null
      if (i.inputIndex) {
        input.inputIndex = i.inputIndex
      }
      inputs.push(input)

      if (outPoint) {
        const previousOutput: OutputEntity | undefined = await connection.getRepository(OutputEntity).findOne({
          outPointTxHash: outPoint.txHash,
          outPointIndex: outPoint.index,
        })

        if (previousOutput && previousOutput.status !== inputStatus) {
          // update previousOutput status here
          previousOutput.status = inputStatus
          previousOutputs.push(previousOutput)
        }
      }
    }

    const outputsData = transaction.outputsData!
    const outputs: OutputEntity[] = transaction.outputs.map((o, index) => {
      const output = new OutputEntity()
      output.outPointTxHash = transaction.hash || transaction.computeHash()
      output.outPointIndex = index.toString()
      output.capacity = o.capacity
      output.lockCodeHash = o.lock.codeHash
      output.lockArgs = o.lock.args
      output.lockHashType = o.lock.hashType
      output.lockHash = o.lockHash!
      output.transaction = tx
      output.status = outputStatus
      output.multiSignBlake160 = o.multiSignBlake160 || null
      if (o.type) {
        output.typeCodeHash = o.type.codeHash
        output.typeArgs = o.type.args
        output.typeHashType = o.type.hashType
        output.typeHash = o.typeHash || null
      }
      const data = outputsData[index]
      output.data = data.slice(0, 130)
      if (data && data !== '0x') {
        output.hasData = true
      } else {
        output.hasData = false
      }
      if (o.daoData) {
        output.daoData = o.daoData
      }
      if (o.depositOutPoint) {
        output.depositTxHash = o.depositOutPoint.txHash
        output.depositIndex = o.depositOutPoint.index
      }
      return output
    })

    const sliceSize = 100
    const queryRunner = connection.createQueryRunner()
    await TransactionPersistor.waitUntilTransactionFinished(queryRunner)
    await queryRunner.startTransaction()
    try {
      await queryRunner.manager.save(tx)
      for (const slice of ArrayUtils.eachSlice(inputs, sliceSize)) {
        await queryRunner.manager.save(slice)
      }
      for (const slice of ArrayUtils.eachSlice(previousOutputs, sliceSize)) {
        await queryRunner.manager.save(slice)
      }
      for (const slice of ArrayUtils.eachSlice(outputs, sliceSize)) {
        await queryRunner.manager.save(slice)
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      logger.error('Database:\tcreate transaction error:', err)
      await queryRunner.rollbackTransaction()
      throw err
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
        await CommonUtils.sleep(50)
      }
    }
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

  public static saveSentTx = async (
    transaction: Transaction,
    txHash: string
  ): Promise<TransactionEntity> => {
    const tx = Transaction.fromObject({
      ...transaction,
      hash: txHash,
    })
    const txEntity: TransactionEntity = await TransactionPersistor.convertTransactionAndSave(tx, TxSaveType.Sent)
    return txEntity
  }
}

export default TransactionPersistor
