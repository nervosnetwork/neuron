import { remote } from 'electron'
import { interval } from 'rxjs'
import { getConnection } from 'typeorm'
import Core from '@nervosnetwork/ckb-sdk-core'
import { TransactionStatus } from 'types/cell-types'
import LockUtils from 'models/lock-utils'
import AddressesUsedSubject from 'models/subjects/addresses-used-subject'
import { FailedTransaction, TransactionPersistor } from 'services/tx'
import { CONNECTION_NOT_FOUND_NAME } from 'database/chain/ormconfig'
import TypeConvert from 'types/type-convert'
import GetBlocks from 'services/sync/get-blocks'

const { nodeService } = remote.require('./startup/sync-block-task/params')

const getTransactionStatus = async (hash: string) => {
  const { core } = nodeService
  const tx = (await core.rpc.getTransaction(hash)) as CKBComponents.TransactionWithStatus
  if (!tx) {
    return {
      tx,
      status: TransactionStatus.Failed,
      blockHash: null,
    }
  }
  if (tx.txStatus.status === 'committed') {
    return {
      tx: TypeConvert.toTransaction(tx.transaction),
      status: TransactionStatus.Success,
      blockHash: tx.txStatus.blockHash,
    }
  }
  return {
    tx: TypeConvert.toTransaction(tx.transaction),
    status: TransactionStatus.Pending,
    blockHash: null,
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
        blockHash: txWithStatus.blockHash,
      }
    })
  )
  const failedTxs = txs.filter(tx => tx.status === TransactionStatus.Failed)
  const successTxs = txs.filter(tx => tx.status === TransactionStatus.Success)

  if (failedTxs.length) {
    const blake160s = await FailedTransaction.updateFailedTxs(failedTxs.map(tx => tx.hash))
    const usedAddresses = blake160s.map(blake160 => LockUtils.blake160ToAddress(blake160))
    const { core } = nodeService
    AddressesUsedSubject.getSubject().next({
      addresses: usedAddresses,
      url: core.rpc.node.url,
    })
  }

  if (successTxs.length > 0) {
    const { core }: { core: Core } = nodeService
    const getBlockService = new GetBlocks(core.rpc.node.url)
    for (const successTx of successTxs) {
      const transaction = successTx.tx
      const { blockHash } = successTx
      const blockHeader = await getBlockService.getHeader(blockHash!)
      transaction.blockHash = blockHash!
      transaction.blockNumber = blockHeader.number
      transaction.timestamp = blockHeader.timestamp
      await TransactionPersistor.saveFetchTx(transaction)
    }
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
