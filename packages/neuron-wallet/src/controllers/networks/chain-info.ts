import initConnection from 'database/chain/ormconfig'
import { updateMetaInfo, getMetaInfo } from 'database/chain/meta-info'
import LockUtils from 'models/lock-utils'
import logger from 'utils/logger'
import DaoUtils from 'models/dao-utils'
import { NetworkWithID, EMPTY_GENESIS_HASH } from 'types/network'
import GetBlocks from 'block-sync-renderer/sync/get-blocks'

// Open connection to a network and maintain chain info in database.
export default class ChainInfo {
  private network: NetworkWithID

  constructor(network: NetworkWithID) {
    this.network = network
  }

  // Connect to the network and load chain info.
  // Returns true if the connected network's genesis hash matches.
  public load = async (): Promise<boolean> => {
    let genesisHash = EMPTY_GENESIS_HASH

    try {
      genesisHash = await new GetBlocks(this.network.remote).genesisBlockHash()
      // If fetched genesis hash doesn't match that of the network, still initalize DB.
      // This would mostly only happens when using default mainnet network but connected to a wrong node.
      await initConnection(genesisHash)
      this.saveMetaInfo(this.network.remote, genesisHash)

      return genesisHash === this.network.genesisHash
    } catch (err) {
      logger.error('Fail to connect to the network. Is CKB node running?')

      await initConnection(this.network.genesisHash)
      this.loadMetaInfo(this.network.genesisHash) // Load cached system scripts that txs could be used offline

      return false
    }
  }

  private saveMetaInfo = async(url: string, genesisHash: string) => {
    try {
      const systemScriptInfo = await LockUtils.systemScript(url)
      const daoScriptInfo = await DaoUtils.daoScript(url)
      updateMetaInfo({ genesisBlockHash: genesisHash, systemScriptInfo, daoScriptInfo })
    } catch (error) {
      logger.error('Update meta info cache failed:', error.toString())
    }
  }

  // TODO: should always load by key `genesisHash`.
  private loadMetaInfo = (_genesisHash: string) => {
    try {
      const metaInfo = getMetaInfo()
      LockUtils.setSystemScript(metaInfo.systemScriptInfo)
      DaoUtils.setDaoScript(metaInfo.daoScriptInfo)
    } catch (error) {
      logger.error('Get cached meta info failed:', error.toString())
    }
  }
}
