import { In, Not } from 'typeorm'
import { getConnection } from '../../database/chain/connection'
import OutputEntity from '../../database/chain/entities/output'
import TransactionEntity from '../../database/chain/entities/transaction'
import { OutputStatus } from '../../models/chain/output'
import TransactionsService from './transaction-service'
import { TransactionStatus } from '../../models/chain/transaction'
import AmendTransactionEntity from '../../database/chain/entities/amend-transaction'

export class FailedTransaction {
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

  public static processAmendFailedTxs = async () => {
    const failedTransactions = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .where({
        status: TransactionStatus.Failed,
      })
      .select('tx.hash', 'hash')
      .getRawMany()

    if (!failedTransactions.length) return

    const failedHashes = failedTransactions.map(item => item.hash)

    const amendTxs = await getConnection()
      .getRepository(AmendTransactionEntity)
      .createQueryBuilder('amend')
      .where([
        { amendHash: In(failedHashes), hash: Not(In(failedHashes)) },
        { hash: In(failedHashes), amendHash: Not(In(failedHashes)) },
      ])
      .getMany()

    if (!amendTxs) return

    const removeTxs: string[] = []
    amendTxs.forEach(({ hash, amendHash }) => {
      if (failedHashes.includes(hash)) {
        removeTxs.push(hash)
      }
      if (failedHashes.includes(amendHash)) {
        removeTxs.push(amendHash)
      }
    })

    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(TransactionEntity)
      .where({ hash: In(removeTxs) })
      .execute()
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
    const blake160s = txs.map(tx => TransactionsService.blake160sOfTx(tx.toModel()))
    const uniqueBlake160s = [...new Set(blake160s.reduce((acc, val) => acc.concat(val), []))]
    return uniqueBlake160s
  }
}

export default FailedTransaction
