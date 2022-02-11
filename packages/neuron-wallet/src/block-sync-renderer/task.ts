import initConnection from 'database/chain/ormconfig'
import logger from 'utils/logger'
// import { sendMessage, WorkerMessage } from 'utils/worker'
import env from 'env'
import { register as registerTxStatusListener, } from './tx-status-listener'
import SyncQueue from './sync/queue'
import { LumosCellQuery } from './sync/indexer-connector'
import { ShouldInChildProcess } from 'exceptions'

let syncQueue: SyncQueue | null

export interface WorkerMessage<T = any> {
  type: 'call' | 'response' | 'kill',
  id?: number,
  channel: 'start' | 'queryIndexer' | 'unmount' | 'cache-tip-block-updated' | 'tx-db-changed' | 'wallet-deleted' | 'address-created' | 'indexer-error'
  message: T
}

type SyncQueueParams = ConstructorParameters<typeof SyncQueue>

export interface StartParams {
  genesisHash: string
  url: SyncQueueParams[0]
  addressMetas: SyncQueueParams[1]
  indexerUrl: SyncQueueParams[2]
}

export type QueryIndexerParams = LumosCellQuery

const unmount = async () => {
  if (!syncQueue) {return}

  logger.debug("Sync:\tstop block sync queue")
  await syncQueue.stopAndWait()
  syncQueue = null
}

process.on('message', async ({ type, id, channel, message }: WorkerMessage) => {
  if (type === 'kill') {
    process.exit(0)
  }
  if (type !== 'call') {return}

  let res = null

  if (!process.send) {
    throw new ShouldInChildProcess()
  }

  switch (channel) {
    case 'start': {
      if (syncQueue) {
        await unmount()
      }

      env.fileBasePath = process.env['fileBasePath'] ?? env.fileBasePath

      try {
        await initConnection(message.genesisHash)

        syncQueue = new SyncQueue(message.url, message.addressMetas, message.indexerUrl)
        syncQueue.start()

      } catch (err) {
        logger.error(`Block Sync Task:\t`, err,)
      }

      break
    }
    case 'unmount': {
      await unmount()
      break
    }
    case 'queryIndexer': {
      if (message) {
        res = await syncQueue?.getIndexerConnector()?.getLiveCellsByScript(message)
      }
      res = []
      break
    }

  }
  process.send({ id, type: `response`, channel, message: res })
})

registerTxStatusListener()

