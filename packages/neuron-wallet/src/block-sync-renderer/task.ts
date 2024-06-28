import { type QueryOptions } from '@ckb-lumos/base'
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
  message: T
}

type SyncQueueParams = ConstructorParameters<typeof SyncQueue>

export interface StartParams {
  genesisHash: string
  url: SyncQueueParams[0]
  addressMetas: SyncQueueParams[1]
  nodeType: SyncQueueParams[2]
  syncMultisig: SyncQueueParams[3]
}

export type QueryIndexerParams = QueryOptions

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

        syncQueue = new SyncQueue(message.url, message.addressMetas, message.nodeType, message.syncMultisig)
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
      try {
        res = message ? await syncQueue?.getIndexerConnector()?.getLiveCellsByScript(message) : []
      } catch (error) {
        logger.error(`Block Sync Task: queryIndexer:\t`, error)
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

process.on('unhandledRejection', reason => {
  logger.error('Unhandled Rejection in task:\tReason:', reason)
})

registerTxStatusListener()
