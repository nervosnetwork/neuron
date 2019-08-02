import { createConnection, getConnectionOptions, getConnection } from 'typeorm'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'
import path from 'path'

import Transaction from './entities/transaction'
import Input from './entities/input'
import Output from './entities/output'
import SyncInfo from './entities/sync-info'

import logger from '../../utils/logger'
import env from '../../env'

import { InitMigration1561695143591 } from './migrations/1561695143591-InitMigration'
import { AddStatusToTx1562038960990 } from './migrations/1562038960990-AddStatusToTx'

export const CONNECTION_NOT_FOUND_NAME = 'ConnectionNotFoundError'

const dbPath = (networkName: string): string => {
  const name = `cell-${networkName}.sqlite`
  return path.join(env.fileBasePath, 'cells', name)
}

const enableWalMode = async () => {
  const result = await getConnection().manager.query(`PRAGMA journal_mode;`)
  if (!(result[0] && result[0].journal_mode === 'wal')) {
    await getConnection().manager.query(`PRAGMA journal_mode=wal;`)
  }
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
    migrations: [InitMigration1561695143591, AddStatusToTx1562038960990],
    logging,
  }
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
    await enableWalMode()
  } catch (err) {
    logger.log({ level: 'error', message: err.message })
  }
}

export default initConnection
