import { createConnection, getConnectionOptions, getConnection } from 'typeorm'
import * as path from 'path'
import env from './env'

import Transaction from './entities/Transaction'
import Input from './entities/Input'
import Output from './entities/Output'
import SyncInfo from './entities/SyncInfo'

import { InitMigration1558328532490 } from './migration/1558328532490-InitMigration'
import { AddSince1558491231870 } from './migration/1558491231870-AddSince'

const dbPath = (networkName: string): string => {
  const name = `cell-${networkName}.sqlite`
  return path.join(env.fileBasePath, name)
}

const connectOptions = async (networkName: string) => {
  const connectionOptions = await getConnectionOptions()
  Object.assign(connectionOptions, {
    database: dbPath(networkName),
    entities: [Transaction, Input, Output, SyncInfo],
    migrations: [InitMigration1558328532490, AddSince1558491231870],
  })

  return connectionOptions
}

export const initConnection = async (networkName: string) => {
  // try to close connection, if not exist, will throw ConnectionNotFoundError when call getConnection()
  try {
    await getConnection().close()
  } catch (e) {
    // console.error(e)
  }
  const connectionOptions = await connectOptions(networkName)

  try {
    await createConnection(connectionOptions)
  } catch (e) {
    console.error(e)
  }
}

export default initConnection
