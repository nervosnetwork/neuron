import { hexToBytes } from '@nervosnetwork/ckb-sdk-utils'
import { QueryRunner, getConnection } from 'typeorm'
import CommonUtils from 'utils/common'
import logger from 'utils/logger'
import { ScriptHashType } from 'models/chain/script'
import LiveCellEntity from 'database/chain/entities/live-cell'
import Transaction from 'models/chain/transaction'

export class LiveCellPersistor {
  public static saveTxLiveCells = async (tx: Transaction) => {
    const connection = getConnection()

    const queryRunner = connection.createQueryRunner()
    await LiveCellPersistor.waitUntilTransactionFinished(queryRunner)
    await queryRunner.startTransaction()

    try {
      tx.inputs.forEach(input => {
        queryRunner.manager.delete(LiveCellEntity, {
          txHash: Buffer.from(hexToBytes(input.previousOutput!.txHash)),
          outputIndex: BigInt(input.previousOutput!.index).toString(),
        })
      })
      const txHash = Buffer.from(hexToBytes(tx.computeHash()))
      for (const [i, output] of tx.outputs.entries()) {
        const outputIndex = i.toString()
        const count = await queryRunner.manager
          .getRepository(LiveCellEntity)
          .createQueryBuilder('cell')
          .where('cell.txHash = :hash and cell.outputIndex = :index', {
            hash: txHash,
            index: outputIndex,
          })
          .getCount()
        if (count === 0) {
          const cellEntity = new LiveCellEntity()
          cellEntity.txHash = txHash
          cellEntity.outputIndex = outputIndex
          cellEntity.capacity = BigInt(output.capacity).toString()
          cellEntity.lockHash = Buffer.from(hexToBytes(output.lockHash))
          cellEntity.lockHashType = output.lock.hashType === ScriptHashType.Data ? '1' : '2'
          cellEntity.lockCodeHash = Buffer.from(hexToBytes(output.lock.codeHash))
          cellEntity.lockArgs = Buffer.from(hexToBytes(output.lock.args))
          if (output.type) {
            cellEntity.typeHash = Buffer.from(hexToBytes(output.typeHash!))
            cellEntity.typeHashType = output.type!.hashType === ScriptHashType.Data ? '1' : '2'
            cellEntity.typeCodeHash = Buffer.from(hexToBytes(output.type!.codeHash))
            cellEntity.typeArgs = Buffer.from(hexToBytes(output.type!.args))
          }
          if (output.data.length > 130) {
            cellEntity.data = Buffer.from(hexToBytes(output.data.slice(0, 130)))
          } else {
            cellEntity.data = Buffer.from(hexToBytes(output.data))
          }
          await queryRunner.manager.save(cellEntity)
        }
      }
      await queryRunner.commitTransaction()
    } catch (err) {
      logger.error('Database:\tsaveTxLiveCells error:', err)
      await queryRunner.rollbackTransaction()
    } finally {
      await queryRunner.release()
    }
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
}
