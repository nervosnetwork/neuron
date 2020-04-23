import { ipcRenderer } from 'electron'
import initConnection from 'database/chain/ormconfig'
import Queue from './sync/queue'
import { register as registerTxStatusListener, unregister as unregisterTxStatusListener } from './tx-status-listener'
import logger from 'utils/logger'

let syncQueue: Queue | null

ipcRenderer.on('block-sync:start', async (_, url: string, genesisHash: string, lockHashes: string[], anyoneCanPayLockHashes: string[], startBlockNumber: string, multiSignBlake160s: string[]) => {
  if (syncQueue) {
    await syncQueue.stopAndWait()
  }

  await initConnection(genesisHash)

  logger.info("Sync:\tstart block sync queue")
  syncQueue = new Queue(url, lockHashes, anyoneCanPayLockHashes, multiSignBlake160s, BigInt(startBlockNumber))
  syncQueue.start()
})

window.addEventListener('beforeunload', () => {
  unregisterTxStatusListener()

  logger.info("Sync:\tstop block sync queue")
  syncQueue?.stop()
  syncQueue = null
})

registerTxStatusListener()
