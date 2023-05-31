import path from 'path'
import fs from 'fs'
import logger from '../utils/logger'
import SyncedBlockNumber from '../models/synced-block-number'
import { clean as cleanChain } from '../database/chain'
import SettingsService from './settings'
import startMonitor, { stopMonitor } from './monitor'
import NodeService from './node'
import { resetSyncTaskQueue } from '../block-sync-renderer'

export default class IndexerService {
  private constructor() {}
  private static instance: IndexerService

  static getInstance = () => {
    if (!IndexerService.instance) {
      IndexerService.instance = new IndexerService()
    }
    return IndexerService.instance
  }

  static clearCache = async (clearIndexerFolder = false) => {
    await cleanChain()

    if (!NodeService.getInstance().isCkbNodeExternal && clearIndexerFolder) {
      await stopMonitor('ckb')
      IndexerService.getInstance().clearData()
      await new SyncedBlockNumber().setNextBlock(BigInt(0))
      await startMonitor('ckb', true)
    }
    resetSyncTaskQueue.asyncPush(true)
  }

  static cleanOldIndexerData() {
    const oldIndexerDataPath = SettingsService.getInstance().indexerDataPath
    if (oldIndexerDataPath && fs.existsSync(oldIndexerDataPath)) {
      logger.debug(`Removing old indexer data ${oldIndexerDataPath}`)
      fs.rmSync(oldIndexerDataPath, { recursive: true, force: true })
      SettingsService.getInstance().indexerDataPath = ''
    }
  }

  clearData = () => {
    const dataPath = this.getDataPath()
    logger.debug(`Removing data ${dataPath}`)
    fs.rmSync(dataPath, { recursive: true, force: true })
  }

  private getDataPath = (): string => {
    let ckbDataPath = SettingsService.getInstance().ckbDataPath
    return path.resolve(ckbDataPath, './data/indexer')
  }
}
