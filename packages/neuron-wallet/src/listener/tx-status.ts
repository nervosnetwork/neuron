import { interval } from 'rxjs'
import TransactionsService from '../services/transactions'
import NodeService from '../services/node'
import { TransactionStatus } from '../types/cell-types'
import LockUtils from '../models/lock-utils'
import AddressesUsedSubject from '../models/subjects/addresses-used-subject'

const getTransactionStatus = async (hash: string) => {
  const { core } = NodeService.getInstance()
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
  const pendingTransactions = await TransactionsService.pendings()
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
  const blake160s = await TransactionsService.updateFailedTxs(failedTxs.map(tx => tx.hash))
  const usedAddresses = blake160s.map(blake160 => LockUtils.blake160ToAddress(blake160))
  AddressesUsedSubject.getSubject().next(usedAddresses)
}

export const register = () => {
  // every 5 seconds
  interval(5000).subscribe(async () => {
    await trackingStatus()
  })
}

export default register
