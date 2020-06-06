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

  public static saveTxLiveCells = async (tx: Transaction, codeHash: string) => {
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

      await Promise.all(tx.inputs.map(input => {
        return queryRunner.manager.update(LiveCellEntity, {
          txHash: Buffer.from(input.previousOutput!.txHash.slice(2), 'hex'),
          outputIndex: BigInt(input.previousOutput!.index).toString(),
        }, {usedBlockNumber: tx.blockNumber!})
      }))
      const txHash = Buffer.from(tx.computeHash().slice(2), 'hex')
      for (const [i, output] of tx.outputs.entries()) {
        if (output.lock.codeHash !== codeHash) {
          continue
        }

        const queryExists = await queryRunner
          .manager
          .query(`SELECT EXISTS (SELECT 1 FROM live_cell where txHash = ? and outputIndex = ?) as exist`, [txHash, i])
        if (queryExists[0].exist === 0) {
          const cellEntity = new LiveCellEntity()
          cellEntity.txHash = txHash
          cellEntity.outputIndex = i
          cellEntity.createdBlockNumber = tx.blockNumber!
          cellEntity.capacity = BigInt(output.capacity).toString()
          cellEntity.lockHash = Buffer.from(output.lockHash.slice(2), 'hex')
          cellEntity.lockHashType = output.lock.hashType === ScriptHashType.Data ? '1' : '2'
          cellEntity.lockCodeHash = Buffer.from(output.lock.codeHash.slice(2), 'hex')
          cellEntity.lockArgs = Buffer.from(output.lock.args.slice(2), 'hex')
          if (output.type) {
            cellEntity.typeHash = Buffer.from(output.typeHash!.slice(2), 'hex')
            cellEntity.typeHashType = output.type!.hashType === ScriptHashType.Data ? '1' : '2'
            cellEntity.typeCodeHash = Buffer.from(output.type!.codeHash.slice(2), 'hex')
            cellEntity.typeArgs = Buffer.from(output.type!.args.slice(2), 'hex')
          }
          cellEntity.data = Buffer.from(tx.outputsData[i].slice(2, 130), 'hex')
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
