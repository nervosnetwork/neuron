import { getConnection } from 'typeorm'
import TransactionEntity from 'database/chain/entities/transaction'
import Utils from 'services/sync/utils'
import InputEntity from 'database/chain/entities/input'
import OutputEntity from 'database/chain/entities/output'
import { TransactionStatus } from 'types/cell-types'
import { OutputStatus } from './params'

export default class IndexerTransaction {
  public static txHashes = async () => {
    const txs = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .where({
        confirmed: false,
        status: TransactionStatus.Success,
      })
      .getMany()

    return txs
  }

  public static confirm = async (hash: string) => {
    await getConnection().manager.update(TransactionEntity, hash, { confirmed: true })
  }

  public static deleteTxWhenFork = async (hash: string) => {
    const tx = await getConnection()
      .getRepository(TransactionEntity)
      .findOne(hash, { relations: ['inputs', 'outputs'] })

    if (!tx) {
      return
    }

    // reset previous output to OutputStatus.Live
    await getConnection().transaction(async transactionalEntityManager => {
      await Utils.mapSeries(tx.inputs, async (input: InputEntity) => {
        if (!input.lockHash) {
          return
        }

        await transactionalEntityManager.update(
          OutputEntity,
          {
            outPointTxHash: input.outPointTxHash,
            outPointIndex: input.outPointIndex,
          },
          { status: OutputStatus.Live }
        )
      })

      await transactionalEntityManager.remove([tx, ...tx.inputs, ...tx.outputs])
    })
  }

  public static updateInputLockHash = async (txHash: string, index: string): Promise<OutputEntity | undefined> => {
    const output: OutputEntity | undefined = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where({
        outPointTxHash: txHash,
        outPointIndex: index,
      })
      .getOne()

    if (output && output.status !== OutputStatus.Dead) {
      await getConnection().manager.update(
        InputEntity,
        {
          outPointTxHash: txHash,
          outPointIndex: index,
        },
        {
          lockHash: output.lockHash,
          capacity: output.capacity,
        }
      )
      output.status = OutputStatus.Dead
      await getConnection().manager.save(output)

      const tx = await getConnection()
        .getRepository(TransactionEntity)
        .createQueryBuilder('tx')
        .where({
          hash: txHash,
        })
        .getOne()
      if (tx) {
        tx.emitUpdate()
      }

      return output
    }

    return output
  }
}
