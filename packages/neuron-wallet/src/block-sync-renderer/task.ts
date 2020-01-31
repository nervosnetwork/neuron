import { ipcRenderer } from 'electron'
import initConnection from 'database/chain/ormconfig'
import Queue from './sync/queue'
import LockUtils from 'models/lock-utils'
import DaoUtils from 'models/dao-utils'
import { register as registerTxStatusListener, unregister as unregisterTxStatusListener } from './tx-status-listener'

let syncQueue: Queue | null
const startBlockSyncing = async (url: string, genesisBlockHash: string, lockHashes: string[], startBlockNumber: bigint) => {
  if (syncQueue) {
    await syncQueue.stopAndWait()
  }

  // TODO: Do not clean meta info here!!!
  LockUtils.cleanInfo()
  DaoUtils.cleanInfo()

  await initConnection(genesisBlockHash)

  syncQueue = new Queue(url, lockHashes, startBlockNumber)
  syncQueue.start()
}


ipcRenderer.on('block-sync:start', async (_, url: string, genesisHash: string, lockHashes: string[], startBlockNumber: string) => {
  await startBlockSyncing(url, genesisHash, lockHashes, BigInt(startBlockNumber))
})

window.addEventListener('beforeunload', () => {
  unregisterTxStatusListener()

  syncQueue?.stop()
  syncQueue = null
})

registerTxStatusListener()
