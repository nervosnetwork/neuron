import { resetSyncTaskQueue } from 'block-sync-renderer/index'
import IndexerService from 'services/indexer'
import { rpcRequest } from 'utils/rpc-request'
import BaseMonitor from './base'

export default class CkbIndexerMonitor extends BaseMonitor {
  async isLiving(): Promise<boolean> {
    try {
      await rpcRequest(IndexerService.LISTEN_URI, { method: 'get_tip' })
      return true
    } catch (error) {
      if (error?.code === 'ECONNREFUSED') {
        return false
      }
      return true
    }
  }

  async restart(): Promise<void> {
    await resetSyncTaskQueue.asyncPush(true)
  }

  async stop(): Promise<void> {
    await resetSyncTaskQueue.asyncPush(false)
  }

  name: string = 'ckb-indexer'
}
