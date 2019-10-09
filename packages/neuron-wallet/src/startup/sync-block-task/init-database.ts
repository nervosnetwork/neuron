import initConnection from 'database/chain/ormconfig'
import Utils from 'services/sync/utils'
import { updateMetaInfo, getMetaInfo } from 'database/chain/meta-info'
import LockUtils from 'models/lock-utils'
import logger from 'utils/logger'
import genesisBlockHash from './genesis'

export const initDatabase = async () => {
  try {
    const hash = await genesisBlockHash()
    await initConnection(hash)

    try {
      const systemScriptInfo = await LockUtils.systemScript()
      updateMetaInfo({ genesisBlockHash: hash, systemScriptInfo })
    } catch (err) {
      logger.error('update systemScriptInfo failed:', err)
    }
  } catch (err) {
    logger.debug('initDatabase error:', err)
    try {
      const metaInfo = getMetaInfo()
      await initConnection(metaInfo.genesisBlockHash)
      LockUtils.setSystemScript(metaInfo.systemScriptInfo)
    } catch (error) {
      Utils.sleep(1000)
      await initDatabase()
    }
  }
}

export default initDatabase
