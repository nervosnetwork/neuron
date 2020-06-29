import { ipcRenderer } from 'electron'
import initConnection from 'database/chain/ormconfig'
import { Address as AddressInterface } from 'database/address/address-dao'
import Queue from './sync/queue'
import { register as registerTxStatusListener, unregister as unregisterTxStatusListener } from './tx-status-listener'
import logger from 'utils/logger'
import { LumosCellQuery } from './sync/indexer-connector'

let syncQueue: Queue | null

ipcRenderer.on('block-sync:start', async (_, url: string, genesisHash: string, addressesMetas: AddressInterface[]) => {
  if (syncQueue) {
    await syncQueue.stopAndWait()
  }

  await initConnection(genesisHash)

  logger.info("Sync:\tstart block sync queue")
  syncQueue = new Queue(url, addressesMetas)
  syncQueue.start()
})

ipcRenderer.on('block-sync:query-indexer', async (_, query: LumosCellQuery, queryId) => {
  const indexerConnector = syncQueue?.getIndexerConnector()
  const liveCells = await indexerConnector?.getLiveCellsByScript(query)
  ipcRenderer.send(`block-sync:query-indexer:${queryId}`, liveCells)
})

window.addEventListener('beforeunload', () => {
  unregisterTxStatusListener()

  logger.info("Sync:\tstop block sync queue")
  syncQueue?.stop()
  syncQueue = null
})

registerTxStatusListener()
