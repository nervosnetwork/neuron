import { remote } from 'electron'
import { interval } from 'rxjs'
import { getConnection } from 'typeorm'
import { TransactionStatus } from '../types/cell-types'
import LockUtils from '../models/lock-utils'
import AddressesUsedSubject from '../models/subjects/addresses-used-subject'
import { FailedTransaction } from '../services/tx'
import { CONNECTION_NOT_FOUND_NAME } from '../database/chain/ormconfig'

const { nodeService } = remote.require('./startup/sync-block-task/params')

const getTransactionStatus = async (hash: string) => {
  const { core } = nodeService
  // getTransaction function return type seems error
  const tx = (await core.rpc.getTransaction(hash)) as any
  if (!tx) {
    return TransactionStatus.Failed
  }
  if (tx.txStatus.status === 'committed') {
    return TransactionStatus.Success
  }
  return TransactionStatus.Pending
}

const trackingStatus = async () => {
  const pendingTransactions = await FailedTransaction.pendings()
  if (!pendingTransactions.length) {
    return
  }
  const pendingHashes = pendingTransactions.map(tx => tx.hash)
  const txs = await Promise.all(
    pendingHashes.map(async hash => {
      const status = await getTransactionStatus(hash)
      return {
        hash,
        status,
      }
    })
  )
  const failedTxs = txs.filter(tx => tx.status === TransactionStatus.Failed)
  if (!failedTxs.length) {
    return
  }
  const blake160s = await FailedTransaction.updateFailedTxs(failedTxs.map(tx => tx.hash))
  const usedAddresses = blake160s.map(blake160 => LockUtils.blake160ToAddress(blake160))
  AddressesUsedSubject.getSubject().next(usedAddresses)
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
