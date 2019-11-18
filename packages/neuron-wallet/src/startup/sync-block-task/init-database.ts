import initConnection from 'database/chain/ormconfig'
import Utils from 'services/sync/utils'
import { updateMetaInfo, getMetaInfo } from 'database/chain/meta-info'
import LockUtils from 'models/lock-utils'
import logger from 'utils/logger'
import genesisBlockHash, { getChain } from './genesis'
import DaoUtils from '../../models/dao-utils'
import { NetworkWithID, EMPTY_GENESIS_HASH } from 'types/network'

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
  private inProcess: boolean = false
  private success: boolean = false

  public id: number = +new Date()

  private static previous: InitDatabase | undefined

  private killed: boolean = false

  private usingPrevious: boolean = false

  public isUsingPrevious = (): boolean => {
    return this.usingPrevious
  }

  public init = async (network: NetworkWithID) => {
    if (InitDatabase.previous) {
      await InitDatabase.previous.stopAndWait()
    }

    this.inProcess = true

    let hash: string = EMPTY_GENESIS_HASH
    let chain: string = ''
    while (!this.stopped && !this.success) {
      try {
        this.usingPrevious = false
        hash = await genesisBlockHash(network.remote)
        await initConnection(hash)
        chain = await getChain(network.remote)

        if (hash === network.genesisHash && chain === network.chain) {
          try {
            const systemScriptInfo = await LockUtils.systemScript(network.remote)
            const daoScriptInfo = await DaoUtils.daoScript(network.remote)
            updateMetaInfo({ genesisBlockHash: hash, systemScriptInfo, chain, daoScriptInfo })
          } catch (err) {
            logger.error('update systemScriptInfo failed:', err)
          }

          this.success = true
        } else {
          logger.error('network genesis hash and chain do not match data fetched')
          this.stopped = true
          this.killed = true // Do not process as successful to let sync start with wrong genesis hash or chain
        }
      } catch (err) {
        logger.error('initDatabase error:', err)
        try {
          const metaInfo = getMetaInfo()
          await initConnection(metaInfo.genesisBlockHash)
          chain = metaInfo.chain
          LockUtils.setSystemScript(metaInfo.systemScriptInfo)
          DaoUtils.setDaoScript(metaInfo.daoScriptInfo)
          hash = metaInfo.genesisBlockHash
          this.success = true
          this.usingPrevious = true
        } catch (error) {
          logger.error('get cached meta info error:', err)
          Utils.sleep(5000)
        }
      }
    }

    this.inProcess = false

    if (this.killed) {
      return 'killed'
    }

    return {
      hash: hash!,
      chain: chain!,
    }
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
