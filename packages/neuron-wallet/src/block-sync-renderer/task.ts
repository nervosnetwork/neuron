import type { LumosCellQuery } from './sync/connector'
import initConnection from '../database/chain/ormconfig'
import { register as registerTxStatusListener } from './tx-status-listener'
import SyncQueue from './sync/queue'
import logger from '../utils/logger'
import { ShouldInChildProcess } from '../exceptions'
import env from '../env'

let syncQueue: SyncQueue | null

export interface WorkerMessage<T = any> {
  type: 'call' | 'response' | 'kill'
  id?: number
  channel:
    | 'start'
    | 'queryIndexer'
    | 'unmount'
    | 'cache-tip-block-updated'
    | 'tx-db-changed'
    | 'wallet-deleted'
    | 'address-created'
    | 'indexer-error'
    | 'check-and-save-wallet-address'
    | 'append_scripts'
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

export const listener = async ({ type, id, channel, message }: WorkerMessage) => {
  if (type === 'kill') {
    process.exit(0)
  }

  if (!process.send) {
    throw new ShouldInChildProcess()
  }

  if (type !== 'call') {
    return
  }

  let res = null

  switch (channel) {
    case 'start': {
      if (syncQueue) {
        return
      }

      env.fileBasePath = process.env['fileBasePath'] ?? env.fileBasePath

      try {
        await initConnection(message.genesisHash)

        syncQueue = new SyncQueue(message.url, message.addressMetas, message.indexerUrl)
        syncQueue.start()
      } catch (err) {
        logger.error(`Block Sync Task:\t`, err)
      }

      break
    }

    case 'unmount': {
      if (!syncQueue) {
        process.exit(0)
        return
      }
      logger.debug('Sync:\tstopping')
      await syncQueue.stopAndWait()
      syncQueue = null
      logger.debug('Sync:\tstopped')
      process.exit(0)
      break
    }

    case 'queryIndexer': {
      res = message ? await syncQueue?.getIndexerConnector()?.getLiveCellsByScript(message) : []
      break
    }
    case 'append_scripts': {
      if (Array.isArray(message)) {
        await syncQueue?.appendLightScript(message)
      }
      break
    }
    default: {
      // ignore
    }
  }
  process.send({ id, type: `response`, channel, message: res })
}

process.on('message', listener)

registerTxStatusListener()
