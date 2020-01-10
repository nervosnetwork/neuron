import { ipcRenderer } from 'electron'
import initConnection from 'database/chain/ormconfig'
import BlockNumber from './sync/block-number'
import Queue from './sync/queue'
import IndexerQueue from './indexer/queue'
import LockUtils from 'models/lock-utils'
import DaoUtils from 'models/dao-utils'
import { register as registerTxStatusListener, unregister as unregisterTxStatusListener } from './tx-status-listener'
import CommonUtils from 'utils/common'
import RpcService from 'services/rpc-service'

const isIndexerEnabled = async (url: string): Promise<boolean> => {
  const rpcService = new RpcService(url)
  try {
    await CommonUtils.retry(3, 100, () => {
      return rpcService.getLockHashIndexStates()
    })
    return true
  } catch {
    return false
  }
}

// Normal block syncing with BlockListener.
// This runs when CKB Indexer module is not enabled.
let syncQueue: Queue | null
const startBlockSyncing = async (url: string, genesisBlockHash: string, lockHashes: string[]) => {
  if (syncQueue) {
    await syncQueue.stopAndWait()
  }

  // TODO: Do not clean meta info here!!!
  LockUtils.cleanInfo()
  DaoUtils.cleanInfo()

  await initConnection(genesisBlockHash)

  syncQueue = new Queue(url, lockHashes)
  syncQueue.start()
}

// Indexer syncing with IndexerQueue.
// This runs when CKB Indexer module is enabled.
let indexerQueue: IndexerQueue | null
const startIndexerSyncing = async (url: string, genesisBlockHash: string, lockHashes: string[]) => {
  if (indexerQueue) {
    await indexerQueue.stopAndWait()
  }

  // TODO: Do not clean meta info here!!!
  LockUtils.cleanInfo()
  DaoUtils.cleanInfo()

  await initConnection(genesisBlockHash)

  const lockHashInfos = lockHashes.map(h => {
    return {
      lockHash: h,
      isImporting: false
    }
  })

  indexerQueue = new IndexerQueue(url, lockHashInfos)
  indexerQueue.start()
  indexerQueue.processFork()
}

ipcRenderer.on('block-sync:start', async (_, url: string, genesisHash: string, lockHashes: string[], rescan = false) => {
  if (await isIndexerEnabled(url)) {
    await startIndexerSyncing(url, genesisHash, lockHashes)
  } else {
    if (rescan) {
      await new BlockNumber().updateCurrent(BigInt(-1))
    }
    await startBlockSyncing(url, genesisHash, lockHashes)
  }
})

window.addEventListener('beforeunload', () => {
  unregisterTxStatusListener()

  syncQueue?.stop()
  syncQueue = null

  indexerQueue?.stop()
  indexerQueue = null
})

registerTxStatusListener()
