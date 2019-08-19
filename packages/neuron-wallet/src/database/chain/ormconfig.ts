import { createConnection, getConnectionOptions, getConnection } from 'typeorm'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'
import path from 'path'

import logger from 'utils/logger'
import env from 'env'

import Transaction from './entities/transaction'
import Input from './entities/input'
import Output from './entities/output'
import SyncInfo from './entities/sync-info'

import { InitMigration1561695143591 } from './migrations/1561695143591-InitMigration'
import { AddStatusToTx1562038960990 } from './migrations/1562038960990-AddStatusToTx'
import { AddConfirmed1565693320664 } from './migrations/1565693320664-AddConfirmed'

export const CONNECTION_NOT_FOUND_NAME = 'ConnectionNotFoundError'

const dbPath = (networkName: string): string => {
  const name = `cell-${networkName}.sqlite`
  return path.join(env.fileBasePath, 'cells', name)
}

const connectOptions = async (genesisBlockHash: string): Promise<SqliteConnectionOptions> => {
  const connectionOptions = await getConnectionOptions()

  const logging: boolean | ('query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration')[] =
    process.env.SHOW_CHAIN_DB_LOG && (env.isDevMode || env.isTestMode) ? true : ['warn', 'error']

  return {
    ...connectionOptions,
    type: 'sqlite',
    database: dbPath(genesisBlockHash),
    entities: [Transaction, Input, Output, SyncInfo],
    migrations: [InitMigration1561695143591, AddStatusToTx1562038960990, AddConfirmed1565693320664],
    logging,
  }
}

const setBusyTimeout = async () => {
  await getConnection().manager.query(`PRAGMA busy_timeout = 3000;`)
}

export const initConnection = async (genesisBlockHash: string) => {
  // try to close connection, if not exist, will throw ConnectionNotFoundError when call getConnection()
  try {
    await getConnection().close()
  } catch (err) {
    // do nothing
  }
  const connectionOptions = await connectOptions(genesisBlockHash)

  try {
    await createConnection(connectionOptions)
    await setBusyTimeout()
  } catch (err) {
    logger.error(err.message)
  }
}

export default initConnection
