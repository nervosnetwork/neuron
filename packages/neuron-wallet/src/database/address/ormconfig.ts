import { createConnection, getConnection as ormGetConnection } from 'typeorm'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'
import path from 'path'

import env from 'env'

import Address from './entities/address'

import { AddAddress1561461669542 } from './migrations/1561461669542-AddAddress'
import { extendBalance1562126909151 } from './migrations/1562126909151-extendBalance'
import { AddTotalBalance1567485550388 } from './migrations/1567485550388-AddTotalBalance'

const dbPath = path.join(env.fileBasePath, 'address.sqlite')

const connectionName = 'address'

const connectOptions = (): SqliteConnectionOptions => {
  const database = env.isTestMode ? ':memory:' : dbPath
  return {
    name: connectionName,
    type: 'sqlite',
    database,
    entities: [Address],
    migrations: [AddAddress1561461669542, extendBalance1562126909151, AddTotalBalance1567485550388],
    synchronize: false,
    migrationsRun: true,
    logging: ['error'],
  }
}

export const getConnection = () => {
  return ormGetConnection(connectionName)
}

const setBusyTimeout = async () => {
  await getConnection().manager.query(`PRAGMA busy_timeout = 3000;`)
}

export const initConnection = async () => {
  const connectionOptions = connectOptions()
  await createConnection(connectionOptions)
  await setBusyTimeout()
}

export default initConnection
