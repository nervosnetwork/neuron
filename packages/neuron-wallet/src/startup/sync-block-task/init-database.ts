import initConnection from 'database/chain/ormconfig'
import { updateMetaInfo, getMetaInfo } from 'database/chain/meta-info'
import LockUtils from 'models/lock-utils'
import logger from 'utils/logger'
import DaoUtils from 'models/dao-utils'
import { NetworkWithID, EMPTY_GENESIS_HASH } from 'types/network'
import GetBlocks from 'services/sync/get-blocks'
import CommonUtils from 'utils/common'

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

  private killed: boolean = false

  private usingPrevious: boolean = false

  public isUsingPrevious = (): boolean => {
    return this.usingPrevious
  }

  saveMetaInfo = async(url: string, genesisHash: string, chain: string) => {
    try {
      const systemScriptInfo = await LockUtils.systemScript(url)
      const daoScriptInfo = await DaoUtils.daoScript(url)
      updateMetaInfo({ genesisBlockHash: genesisHash, systemScriptInfo, chain, daoScriptInfo })
    } catch (err) {
      logger.error('Update systemScriptInfo failed:', err.toString())
    }
  }

  public init = async (network: NetworkWithID) => {
    this.inProcess = true

    let hash: string = EMPTY_GENESIS_HASH
    let chain: string = ''
    const getBlockService = new GetBlocks(network.remote)
    while (!this.stopped && !this.success) {
      try {
        this.usingPrevious = false
        hash = await getBlockService.genesisBlockHash()
        await initConnection(hash)
        chain = await getBlockService.getChain()

        if (hash === network.genesisHash && chain === network.chain) {
          this.saveMetaInfo(network.remote, hash, chain)
          this.success = true
        } else {
          logger.error('Network genesis hash and chain do not match data fetched')
          this.stopped = true
          this.killed = true // Do not process as successful to let sync start with wrong genesis hash or chain
        }
      } catch (err) {
        logger.error('Init database failed. Is CKB node available? Use previous saved connection info.')
        try {
          const metaInfo = getMetaInfo()
          await initConnection(metaInfo.genesisBlockHash)
          LockUtils.setSystemScript(metaInfo.systemScriptInfo)
          DaoUtils.setDaoScript(metaInfo.daoScriptInfo)
          hash = metaInfo.genesisBlockHash
          chain = metaInfo.chain
          this.success = true
          this.usingPrevious = true
        } catch (error) {
          logger.error('get cached meta info error:', error)
          await CommonUtils.sleep(5000)
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
      await CommonUtils.sleep(100)
    }

    this.killed = false
    this.stopped = false
    this.success = false
    this.inProcess = false
  }
}

export default InitDatabase
