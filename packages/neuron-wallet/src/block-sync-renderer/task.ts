import initConnection from 'database/chain/ormconfig'
import { Address as AddressInterface } from 'database/address/address-dao'
import Queue from './sync/queue'
import { register as registerTxStatusListener, unregister as unregisterTxStatusListener } from './tx-status-listener'
import logger from 'utils/logger'
import { LumosCellQuery } from './sync/indexer-connector'
import { EventEmitter } from 'events'

let syncQueue: Queue | null

export default class SyncTask extends EventEmitter {
  public mount() {
    this.emit('mounted')
  }

  public unmount() {
    unregisterTxStatusListener()

    logger.info("Sync:\tstop block sync queue")
    syncQueue?.stop()
    syncQueue = null
  }

  public async start(url: string, genesisHash: string, addressesMetas: AddressInterface[]) {
    if (syncQueue) {
      await syncQueue.stopAndWait()
    }

    await initConnection(genesisHash)

    logger.info("Sync:\tstart block sync queue")
    syncQueue = new Queue(url, addressesMetas)
    syncQueue.start()
  }

  public async queryIndexer (query: LumosCellQuery) {
    const indexerConnector = syncQueue?.getIndexerConnector()
    return await indexerConnector?.getLiveCellsByScript(query)
  }
}

registerTxStatusListener()
