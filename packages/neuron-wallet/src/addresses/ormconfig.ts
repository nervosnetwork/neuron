import { createConnection, getConnection as ormGetConnection } from 'typeorm'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'
import path from 'path'

import env from '../env'

import Address from './entities/address'

import { AddAddress1560998222848 } from './migrations/1560998222848-AddAddress'

const dbPath = path.join(env.fileBasePath, 'address.sqlite')

const connectionName = 'address'

const connectOptions = (): SqliteConnectionOptions => {
  const database = env.isTestMode ? ':memory:' : dbPath
  return {
    name: connectionName,
    type: 'sqlite',
    database,
    entities: [Address],
    migrations: [AddAddress1560998222848],
    synchronize: false,
    migrationsRun: true,
    logging: true,
  }
}

export const initConnection = async () => {
  const connectionOptions = connectOptions()
  await createConnection(connectionOptions)
}

export const getConnection = () => {
  return ormGetConnection(connectionName)
}

export default initConnection
