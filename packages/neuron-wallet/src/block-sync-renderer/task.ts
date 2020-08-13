import initConnection from 'database/chain/ormconfig'
import { Address as AddressInterface } from 'database/address/address-dao'
import Queue from './sync/queue'
import { register as registerTxStatusListener, unregister as unregisterTxStatusListener } from './tx-status-listener'
import logger from 'utils/logger'
import { LumosCellQuery } from './sync/indexer-connector'
import { expose } from 'utils/worker'
import env from 'env'

let syncQueue: Queue | null

export type SyncTask = typeof syncTask

const syncTask = {
  unmount() {
    unregisterTxStatusListener()

    logger.info("Sync:\tstop block sync queue")
    syncQueue?.stop()
    syncQueue = null
  },
  async start(url: string, genesisHash: string, addressesMetas: AddressInterface[]) {
    if (syncQueue) {
      await syncQueue.stopAndWait()
    }

    // reset `fileBasePath` from master process
    env.fileBasePath = process.env['fileBasePath'] ?? env.fileBasePath
    await initConnection(genesisHash)

    logger.info("Sync:\tstart block sync queue")
    syncQueue = new Queue(url, addressesMetas)
    syncQueue.start()
  },
  async queryIndexer (query: LumosCellQuery) {
    const indexerConnector = syncQueue?.getIndexerConnector()
    return await indexerConnector?.getLiveCellsByScript(query)
  }
}

export default syncTask

expose(syncTask)

registerTxStatusListener()
