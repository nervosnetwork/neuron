import { remote } from 'electron'
import { interval } from 'rxjs'
import { getConnection } from 'typeorm'
import { TransactionStatus } from 'types/cell-types'
import LockUtils from 'models/lock-utils'
import AddressesUsedSubject from 'models/subjects/addresses-used-subject'
import { FailedTransaction, TransactionPersistor } from 'services/tx'
import { CONNECTION_NOT_FOUND_NAME } from 'database/chain/ormconfig'
import TypeConvert from 'types/type-convert'

const { nodeService } = remote.require('./startup/sync-block-task/params')

const getTransactionStatus = async (hash: string) => {
  const { core } = nodeService
  const tx = (await core.rpc.getTransaction(hash)) as CKBComponents.TransactionWithStatus
  if (!tx) {
    return {
      tx,
      status: TransactionStatus.Failed,
    }
  }
  if (tx.txStatus.status === 'committed') {
    return {
      tx: tx.transaction,
      status: TransactionStatus.Success,
    }
  }
  return {
    tx: tx.transaction,
    status: TransactionStatus.Pending,
  }
}

/* eslint no-await-in-loop: "off" */
/* eslint no-restricted-syntax: "off" */
const trackingStatus = async () => {
  const pendingTransactions = await FailedTransaction.pendings()
  if (!pendingTransactions.length) {
    return
  }
  const pendingHashes = pendingTransactions.map(tx => tx.hash)
  const txs = await Promise.all(
    pendingHashes.map(async hash => {
      const txWithStatus = await getTransactionStatus(hash)
      return {
        hash,
        tx: txWithStatus.tx,
        status: txWithStatus.status,
      }
    })
  )
  const failedTxs = txs.filter(tx => tx.status === TransactionStatus.Failed)
  const successTxs = txs.filter(tx => tx.status === TransactionStatus.Success)

  if (failedTxs.length) {
    const blake160s = await FailedTransaction.updateFailedTxs(failedTxs.map(tx => tx.hash))
    const usedAddresses = blake160s.map(blake160 => LockUtils.blake160ToAddress(blake160))
    AddressesUsedSubject.getSubject().next(usedAddresses)
  }

  for (const successTx of successTxs) {
    const transaction = TypeConvert.toTransaction(successTx.tx)
    await TransactionPersistor.saveFetchTx(transaction)
  }
}

export const register = () => {
  // every 5 seconds
  interval(5000).subscribe(async () => {
    try {
      getConnection()
      await trackingStatus()
    } catch (err) {
      if (err.name !== CONNECTION_NOT_FOUND_NAME) {
        throw err
      }
    }
  })
}

export default register
