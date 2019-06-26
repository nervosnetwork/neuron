import initConnection from '../../database/chain/ormconfig'
import Utils from '../../services/sync/utils'
import genesisBlockHash from './genesis'

export const initDatabase = async () => {
  try {
    const hash = await genesisBlockHash()
    await initConnection(hash)
  } catch (err) {
    Utils.sleep(1000)
    await initDatabase()
  }
}

export default initDatabase
