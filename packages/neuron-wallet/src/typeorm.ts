import { createConnection, getConnectionOptions, getConnection } from 'typeorm'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'
import path from 'path'

import Transaction from './entities/Transaction'
import Input from './entities/Input'
import Output from './entities/Output'
import SyncInfo from './entities/SyncInfo'

import logger from './utils/logger'
import env from './env'

import { InitMigration1558328532490 } from './migration/1558328532490-InitMigration'

const dbPath = (networkName: string): string => {
  const name = `cell-${networkName}.sqlite`
  return path.join(env.fileBasePath, 'cells', name)
}

const connectOptions = async (networkName: string): Promise<SqliteConnectionOptions> => {
  const connectionOptions = await getConnectionOptions()

  return {
    ...connectionOptions,
    type: 'sqlite',
    database: dbPath(networkName),
    entities: [Transaction, Input, Output, SyncInfo],
    migrations: [InitMigration1558328532490],
  }
}

export const initConnection = async (networkName: string) => {
  // try to close connection, if not exist, will throw ConnectionNotFoundError when call getConnection()
  try {
    await getConnection().close()
  } catch (err) {
    logger.log({ level: 'error', message: err.message })
  }
  const connectionOptions = await connectOptions(networkName)

  try {
    await createConnection(connectionOptions)
  } catch (err) {
    logger.log({ level: 'error', message: err.message })
  }
}

export default initConnection
