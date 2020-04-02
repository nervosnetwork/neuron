import { hexToBytes } from '@nervosnetwork/ckb-sdk-utils'
import { QueryRunner, getConnection } from 'typeorm'
import CommonUtils from 'utils/common'
import logger from 'utils/logger'
import { ScriptHashType } from 'models/chain/script'
import LiveCellEntity from 'database/chain/entities/live-cell'
import SyncInfoEntity from 'database/chain/entities/sync-info'
import Transaction from 'models/chain/transaction'

export class LiveCellPersistor {
  public static CONFIRMATION_THRESHOLD = BigInt(300)
  public static DELETE_BATCH = BigInt(50)
  public static ZERO = BigInt(0)

  public static saveTxLiveCells = async (tx: Transaction) => {
    const connection = getConnection()

    const queryRunner = connection.createQueryRunner()
    await LiveCellPersistor.waitUntilTransactionFinished(queryRunner)
    await queryRunner.startTransaction()

    try {
      const blockNumber = BigInt(tx.blockNumber!)
      if(blockNumber % LiveCellPersistor.DELETE_BATCH === LiveCellPersistor.ZERO) {
        queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(LiveCellEntity)
          .where(
            `usedBlockNumber is not null and usedBlockNumber < :blockNumber`,
            {
              blockNumber: (blockNumber - LiveCellPersistor.CONFIRMATION_THRESHOLD).toString(),
            }
          )
          .execute()
      }

      tx.inputs.forEach(input => {
        queryRunner.manager.update(LiveCellEntity, {
          txHash: Buffer.from(hexToBytes(input.previousOutput!.txHash)),
          outputIndex: BigInt(input.previousOutput!.index).toString(),
        }, {usedBlockNumber: tx.blockNumber!})
      })
      const txHash = Buffer.from(hexToBytes(tx.computeHash()))
      for (const [i, output] of tx.outputs.entries()) {
        const count = await queryRunner.manager
          .getRepository(LiveCellEntity)
          .createQueryBuilder('cell')
          .where('cell.txHash = :hash and cell.outputIndex = :index', {
            hash: txHash,
            index: i,
          })
          .getCount()
        if (count === 0) {
          const cellEntity = new LiveCellEntity()
          cellEntity.txHash = txHash
          cellEntity.outputIndex = i
          cellEntity.createdBlockNumber = tx.blockNumber!
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

  public static resumeWhenFork = async (blockNumber: string) => {
    const connection = getConnection()
    const repository = connection.getRepository(LiveCellEntity)
    await repository.createQueryBuilder('cell')
      .where(
        `cell.createdBlockNumber >= :blockNumber`,
        {
          blockNumber,
        }
      )
      .delete()
      .execute()
    await repository.createQueryBuilder('cell')
      .where(
        `cell.usedBlockNumber is not null and cell.usedBlockNumber >= :blockNumber`,
        {
          blockNumber,
        }
      )
      .update({usedBlockNumber: null})
      .execute()
  }

  public static lastBlockNumber = async () => {
    const last = await getConnection()
      .getRepository(SyncInfoEntity)
      .findOne({
        name: SyncInfoEntity.CURRENT_LIVE_CELL_BLOCK_NUMBER,
      })
    if (last) {
      return last.value
    }
    return '0'
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
