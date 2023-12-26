import path from 'path'
import fs from 'fs'
import logger from '../utils/logger'
import { clean as cleanChain } from '../database/chain'
import SettingsService from './settings'
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

  static clearCache = async () => {
    await cleanChain()
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
    const ckbDataPath = SettingsService.getInstance().getNodeDataPath()
    return path.resolve(ckbDataPath, './data/indexer')
  }
}
