import { createConnection, getConnectionOptions, getConnection } from 'typeorm'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'
import path from 'path'

import Transaction from './entities/transaction'
import Input from './entities/input'
import Output from './entities/output'
import SyncInfo from './entities/sync-info'

import logger from '../../utils/logger'
import env from '../../env'

import { InitMigration1561352954925 } from './migrations/1561352954925-InitMigration'

const dbPath = (networkName: string): string => {
  const name = `cell-${networkName}.sqlite`
  return path.join(env.fileBasePath, 'cells', name)
}

const connectOptions = async (genesisBlockHash: string): Promise<SqliteConnectionOptions> => {
  const connectionOptions = await getConnectionOptions()

  return {
    ...connectionOptions,
    type: 'sqlite',
    database: dbPath(genesisBlockHash),
    entities: [Transaction, Input, Output, SyncInfo],
    migrations: [InitMigration1561352954925],
  }
}

export const initConnection = async (genesisBlockHash: string) => {
  // try to close connection, if not exist, will throw ConnectionNotFoundError when call getConnection()
  try {
    await getConnection().close()
  } catch (err) {
    logger.log({ level: 'error', message: err.message })
  }
  const connectionOptions = await connectOptions(genesisBlockHash)

  try {
    await createConnection(connectionOptions)
  } catch (err) {
    logger.log({ level: 'error', message: err.message })
  }
}

export default initConnection
