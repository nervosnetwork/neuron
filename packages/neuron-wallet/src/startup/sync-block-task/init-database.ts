import initConnection from 'database/chain/ormconfig'
import Utils from 'services/sync/utils'
import { updateMetaInfo, getMetaInfo } from 'database/chain/meta-info'
import LockUtils from 'models/lock-utils'
import logger from 'utils/logger'
import genesisBlockHash from './genesis'

// only used by main process
export class InitDatabase {
  private static instance: InitDatabase

  public static getInstance = () => {
    if (!InitDatabase.instance) {
      InitDatabase.instance = new InitDatabase()
    }
    return InitDatabase.instance
  }

  private stopped: boolean = false
  // private nodeURL: string
  private inProcess: boolean = false

  private success: boolean = false

  public id: number = +new Date()

  private static previous: InitDatabase | undefined

  private killed: boolean = false

  public init = async (url: string): Promise<string> => {
    if (InitDatabase.previous) {
      await InitDatabase.previous.stopAndWait()
    }

    this.inProcess = true

    let hash: string | undefined
    while (!this.stopped && !this.success) {
      try {
        hash = await genesisBlockHash(url)
        await initConnection(hash)

        try {
          const systemScriptInfo = await LockUtils.systemScript(url)
          updateMetaInfo({ genesisBlockHash: hash, systemScriptInfo })
        } catch (err) {
          logger.error('update systemScriptInfo failed:', err)
        }

        this.success = true
      } catch (err) {
        logger.debug('initDatabase error:', err)
        try {
          const metaInfo = getMetaInfo()
          await initConnection(metaInfo.genesisBlockHash)
          LockUtils.setSystemScript(metaInfo.systemScriptInfo)
          hash = metaInfo.genesisBlockHash
          this.success = true
        } catch (error) {
          Utils.sleep(5000)
        }
      }
    }

    this.inProcess = false

    if (this.killed) {
      return 'killed'
    }

    return hash!
  }

  public stopAndWait = async (timeout: number = 10000) => {
    this.killed = true
    this.stopped = true

    const startAt: number = +new Date()
    while (this.inProcess) {
      const now: number = +new Date()
      if (now - startAt > timeout) {
        return
      }
      await Utils.sleep(100)
    }

    this.killed = false
    this.stopped = false
    this.success = false
    this.inProcess = false
  }
}

export default InitDatabase
