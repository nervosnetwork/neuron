import { interval } from 'rxjs'
import { getConnection } from 'typeorm'
import Core from '@nervosnetwork/ckb-sdk-core'
import LockUtils from 'models/lock-utils'
import { FailedTransaction, TransactionPersistor } from 'services/tx'
import { CONNECTION_NOT_FOUND_NAME } from 'database/chain/ormconfig'
import GetBlocks from 'block-sync-renderer/sync/get-blocks'
import NetworksService from 'services/networks'
import { AddressPrefix } from 'models/keys/address'
import NodeService from 'services/node'
import WalletService from 'services/wallets'
import { TransactionStatus } from 'models/chain/transaction'
import { TransactionWithStatus } from 'models/chain/transaction-with-status'

const getTransactionStatus = async (hash: string) => {
  const url: string = NodeService.getInstance().core.rpc.node.url
  const getBlockService = new GetBlocks(url)
  const txWithStatus: TransactionWithStatus | undefined = await getBlockService.getTransaction(hash)
  if (!txWithStatus) {
    return {
      tx: txWithStatus,
      status: TransactionStatus.Failed,
      blockHash: null,
    }
  }
  if (txWithStatus.txStatus.status === 'committed') {
    return {
      tx: txWithStatus.transaction,
      status: TransactionStatus.Success,
      blockHash: txWithStatus.txStatus.blockHash,
    }
  }
  return {
    tx: txWithStatus.transaction,
    status: TransactionStatus.Pending,
    blockHash: null,
  }
}

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
    const prefix = NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
    const usedAddresses = blake160s.map(blake160 => LockUtils.blake160ToAddress(blake160, prefix))
    const { core } = NodeService.getInstance()
    await WalletService.updateUsedAddresses(usedAddresses, core.rpc.node.url)
  }

  if (successTxs.length > 0) {
    const url: string = NodeService.getInstance().core.rpc.node.url
    const core = new Core(url)
    const getBlockService = new GetBlocks(core.rpc.node.url)
    for (const successTx of successTxs) {
      const transaction = successTx.tx!
      const { blockHash } = successTx
      const blockHeader = await getBlockService.getHeader(blockHash!)
      if (blockHeader) {
        transaction.setBlockHeader(blockHeader)
        await TransactionPersistor.saveFetchTx(transaction)
      }
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

export const unregister = () => {
  // Nothing to do. This interval subscription will be killed with the renderer process.
}

export default register
