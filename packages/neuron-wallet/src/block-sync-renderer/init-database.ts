import initConnection from 'database/chain/ormconfig'
import { updateMetaInfo, getMetaInfo } from 'database/chain/meta-info'
import LockUtils from 'models/lock-utils'
import logger from 'utils/logger'
import DaoUtils from 'models/dao-utils'
import { NetworkWithID, EMPTY_GENESIS_HASH } from 'types/network'
import GetBlocks from 'block-sync-renderer/sync/get-blocks'
import CommonUtils from 'utils/common'

// TODO: Move this out of sync task. It should be controlled by main app.
export class InitDatabase {
  private initializing = false
  // Cannot connect thus use the cached info of last connected chain.
  private usingPrevious = false

  public isUsingPrevious = (): boolean => {
    return this.usingPrevious
  }

  saveMetaInfo = async(url: string, genesisHash: string) => {
    try {
      const systemScriptInfo = await LockUtils.systemScript(url)
      const daoScriptInfo = await DaoUtils.daoScript(url)
      updateMetaInfo({ genesisBlockHash: genesisHash, systemScriptInfo, daoScriptInfo })
    } catch (err) {
      logger.error('Update systemScriptInfo failed:', err.toString())
    }
  }

  // Initialize database and return genesis hash of the network.
  // Return empty string if there's no connection or pre-saved network info.
  public init = async (network: NetworkWithID) => {
    this.initializing = true

    let hash: string = EMPTY_GENESIS_HASH
    const getBlockService = new GetBlocks(network.remote)

    try {
      this.usingPrevious = false
      hash = await getBlockService.genesisBlockHash()

      if (hash === network.genesisHash) {
        this.saveMetaInfo(network.remote, hash)
      } else {
        // Do not process as successful to let sync start with wrong genesis hash or chain
        logger.error('Network genesis hash and chain do not match data fetched')
        hash = EMPTY_GENESIS_HASH
      }
    } catch (err) {
      logger.error('Init database failed. Is CKB node available? Use previous saved connection info.')
      try {
        const metaInfo = getMetaInfo()
        LockUtils.setSystemScript(metaInfo.systemScriptInfo)
        DaoUtils.setDaoScript(metaInfo.daoScriptInfo)
        hash = metaInfo.genesisBlockHash
        this.usingPrevious = true
      } catch (error) {
        logger.error('Get cached meta info error:', error)
        hash = EMPTY_GENESIS_HASH
      }
    }

    if (hash !== EMPTY_GENESIS_HASH) {
      await initConnection(hash)
    }
    this.initializing = false

    return hash
  }

  public stop = async (timeout: number = 10000) => {
    const startAt: number = +new Date()
    while (this.initializing) {
      const now: number = +new Date()
      if (now - startAt > timeout) {
        return
      }
      await CommonUtils.sleep(100)
    }

    this.initializing = false
  }
}

export default InitDatabase
