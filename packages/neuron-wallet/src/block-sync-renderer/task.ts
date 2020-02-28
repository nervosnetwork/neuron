import { ipcRenderer } from 'electron'
import initConnection from 'database/chain/ormconfig'
import Queue from './sync/queue'
import LockUtils from 'models/lock-utils'
import DaoUtils from 'models/dao-utils'
import { register as registerTxStatusListener, unregister as unregisterTxStatusListener } from './tx-status-listener'
import logger from 'utils/logger'

let syncQueue: Queue | null

ipcRenderer.on('block-sync:start', async (_, url: string, genesisHash: string, lockHashes: string[], startBlockNumber: string, multiSignCodeHash: string, multiSignBlake160s: string[]) => {
  if (syncQueue) {
    await syncQueue.stopAndWait()
  }

  // TODO: Do not clean meta info here!!!
  LockUtils.cleanInfo()
  DaoUtils.cleanInfo()

  await initConnection(genesisHash)

  logger.info("Sync:\tstart block sync queue")
  syncQueue = new Queue(url, lockHashes, multiSignCodeHash, multiSignBlake160s, BigInt(startBlockNumber))
  syncQueue.start()
})

window.addEventListener('beforeunload', () => {
  unregisterTxStatusListener()

  logger.info("Sync:\tstop block sync queue")
  syncQueue?.stop()
  syncQueue = null
})

registerTxStatusListener()
