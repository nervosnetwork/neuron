import { ipcRenderer } from 'electron'
import initConnection from 'database/chain/ormconfig'
import IndexerRPC from 'services/indexer/indexer-rpc'
import BlockListener from 'services/sync/block-listener'
import IndexerQueue from 'services/indexer/queue'
import LockUtils from 'models/lock-utils'
import DaoUtils from 'models/dao-utils'
import { register as registerTxStatusListener, unregister as unregisterTxStatusListener } from 'listeners/renderer/tx-status'
import CommonUtils from 'utils/common'

const isIndexerEnabled = async (url: string): Promise<boolean> => {
  const indexerRPC = new IndexerRPC(url)
  try {
    await CommonUtils.retry(3, 100, () => {
      return indexerRPC.getLockHashIndexStates()
    })
    return true
  } catch {
    return false
  }
}

// Normal block syncing with BlockListener.
// This runs when CKB Indexer module is not enabled.
let blockListener: BlockListener | null
export const startBlockSyncing = async (url: string, genesisBlockHash: string, lockHashes: string[]) => {
  if (blockListener) {
    await blockListener.stopAndWait()
  }

  LockUtils.cleanInfo()
  DaoUtils.cleanInfo()

  await initConnection(genesisBlockHash)

  blockListener = new BlockListener(url, lockHashes)
  blockListener.start()
}

// Indexer syncing with IndexerQueue.
// This runs when CKB Indexer module is enabled.
let indexerQueue: IndexerQueue | null
export const startIndexerSyncing = async (nodeURL: string, genesisBlockHash: string, lockHashes: string[]) => {
  if (indexerQueue) {
    await indexerQueue.stopAndWait()
  }

  LockUtils.cleanInfo()
  DaoUtils.cleanInfo()

  await initConnection(genesisBlockHash)

  const lockHashInfos = lockHashes.map(h => {
    return {
      lockHash: h,
      isImporting: false
    }
  })

  indexerQueue = new IndexerQueue(nodeURL, lockHashInfos)

  indexerQueue.start()
  indexerQueue.processFork()
}

ipcRenderer.on('block-sync:start', async (_, url: string, genesisHash: string, lockHashes: string[]) => {
  if (await isIndexerEnabled(url)) {
    await startIndexerSyncing(url, genesisHash, lockHashes)
  } else {
    await startBlockSyncing(url, genesisHash, lockHashes)
  }
})

ipcRenderer.on('block-sync:will-close', () => {
  unregisterTxStatusListener()

  if (blockListener) {
    blockListener.stop()
    blockListener = null
  }

  if (indexerQueue) {
    indexerQueue.stop()
    indexerQueue = null
  }
})

registerTxStatusListener()
