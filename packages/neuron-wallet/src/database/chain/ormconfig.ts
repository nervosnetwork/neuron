import { createConnection, getConnectionOptions, getConnection } from 'typeorm'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'
import path from 'path'

import logger from 'utils/logger'
import env from 'env'

import Transaction from './entities/transaction'
import Input from './entities/input'
import Output from './entities/output'
import SyncInfo from './entities/sync-info'
import { InitMigration1566959757554 } from './migrations/1566959757554-InitMigration'
import { AddTypeAndHasData1567144517514 } from './migrations/1567144517514-AddTypeAndHasData'
import { ChangeHasDataDefault1568621556467 } from './migrations/1568621556467-ChangeHasDataDefault'
import { AddLockToInput1570522869590 } from './migrations/1570522869590-AddLockToInput'
import { AddIndices1572006450765 } from './migrations/1572006450765-AddIndices'

export const CONNECTION_NOT_FOUND_NAME = 'ConnectionNotFoundError'

const dbPath = (networkName: string): string => {
  const name = `cell-${networkName}.sqlite`
  return path.join(env.fileBasePath, 'cells', name)
}

const connectOptions = async (genesisBlockHash: string): Promise<SqliteConnectionOptions> => {
  const connectionOptions = await getConnectionOptions()
  const database = env.isTestMode ? ':memory:' : dbPath(genesisBlockHash)

  const logging: boolean | ('query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration')[] =
    (env.isDevMode || env.isTestMode) ? ['warn', 'error', 'log', 'info', 'schema', 'migration'] : ['warn', 'error']

  return {
    ...connectionOptions,
    type: 'sqlite',
    database,
    entities: [Transaction, Input, Output, SyncInfo],
    migrations: [
      InitMigration1566959757554,
      AddTypeAndHasData1567144517514,
      ChangeHasDataDefault1568621556467,
      AddLockToInput1570522869590,
      AddIndices1572006450765
    ],
    logging,
    maxQueryExecutionTime: 100
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
