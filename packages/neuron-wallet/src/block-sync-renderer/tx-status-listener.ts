import { CONNECTION_NOT_FOUND_NAME } from '../database/chain/ormconfig'
import { FailedTransaction, TransactionPersistor } from '../services/tx'
import RpcService from '../services/rpc-service'
import NetworksService from '../services/networks'
import Transaction, { TransactionStatus } from '../models/chain/transaction'
import TransactionWithStatus from '../models/chain/transaction-with-status'
import logger from '../utils/logger'
import { getConnection } from '../database/chain/connection'
import { interval } from 'rxjs'
import TxStatus from '../models/chain/tx-status'

type TransactionDetail = {
  hash: string
  tx: Transaction | undefined
  status: TransactionStatus
  blockHash: string | null
}

const getTransactionStatus = async (hash: string) => {
  const network = NetworksService.getInstance().getCurrent()
  const rpcService = new RpcService(network.remote, network.type)
  const txWithStatus: TransactionWithStatus | undefined | { transaction: null; txStatus: TxStatus } =
    await rpcService.getTransaction(hash)
  if (!txWithStatus) {
    return {
      tx: txWithStatus,
      status: TransactionStatus.Failed,
      blockHash: null,
    }
  }
  if (txWithStatus.txStatus.isCommitted()) {
    return {
      tx: txWithStatus.transaction,
      status: TransactionStatus.Success,
      blockHash: txWithStatus.txStatus.blockHash,
    }
  }
  if (txWithStatus.txStatus.isRejected()) {
    return {
      tx: null,
      status: TransactionStatus.Rejected,
      blockHash: null,
    }
  }
  return {
    tx: txWithStatus.transaction,
    status: TransactionStatus.Pending,
    blockHash: null,
  }
}

const trackingStatus = async () => {
  const pendingOrFailedTransactions = await FailedTransaction.pendingOrFaileds()
  await FailedTransaction.processAmendFailedTxs()

  if (!pendingOrFailedTransactions.length) {
    return
  }

  const pendingOrFailedHashes = pendingOrFailedTransactions.map(tx => tx.hash)
  const txs = await Promise.all(
    pendingOrFailedHashes.map(async hash => {
      try {
        const txWithStatus = await getTransactionStatus(hash)
        return {
          hash,
          tx: txWithStatus.tx,
          status: txWithStatus.status,
          blockHash: txWithStatus.blockHash,
        }
      } catch (error) {
        // ignore error, get failed skip current update
      }
    })
  )

  const failedTxs = txs.filter((tx): tx is TransactionDetail => tx?.status === TransactionStatus.Failed)
  const successTxs = txs.filter((tx): tx is TransactionDetail => tx?.status === TransactionStatus.Success)
  const rejectedTxs = txs.filter((tx): tx is TransactionDetail => tx?.status === TransactionStatus.Rejected)

  if (failedTxs.length) {
    await FailedTransaction.updateFailedTxs(failedTxs.map(tx => tx.hash))
  }

  if (rejectedTxs.length) {
    await FailedTransaction.deleteFailedTxs(rejectedTxs.map(tx => tx.hash))
  }

  if (successTxs.length > 0) {
    const network = NetworksService.getInstance().getCurrent()
    const rpcService = new RpcService(network.remote, network.type)
    for (const successTx of successTxs) {
      const transaction = successTx.tx!
      const { blockHash } = successTx
      const blockHeader = await rpcService.getHeader(blockHash!)
      if (blockHeader) {
        transaction.setBlockHeader(blockHeader)
        await TransactionPersistor.saveFetchTx(transaction)
      }
    }
  }
}

export const register = () => {
  interval(5000).subscribe(async () => {
    try {
      getConnection()
      await trackingStatus()
    } catch (err) {
      logger.warn(`status tracking error: ${err}`)
      if (err.name !== CONNECTION_NOT_FOUND_NAME) {
        throw err
      }
    }
  })
}
