import { createConnection, getConnectionOptions, getConnection } from 'typeorm'
import * as path from 'path'
import app from './app'
import env from './env'

import Transaction from './entities/Transaction'
import Input from './entities/Input'
import Output from './entities/Output'
import SyncInfo from './entities/SyncInfo'

import { InitMigration1557483560422 } from './migration/1557483560422-InitMigration'

const userDataPath = app.getPath('userData')

const dbPath = (networkName: string): string => {
  const name = `cell-${networkName}.sqlite`
  if (env.isDevMode) {
    return path.join(userDataPath, 'dev', name)
  }
  return path.join(userDataPath, name)
}

const connectOptions = async (networkName: string) => {
  const connectionOptions = await getConnectionOptions()
  Object.assign(connectionOptions, {
    database: dbPath(networkName),
    entities: [Transaction, Input, Output, SyncInfo],
    migrations: [InitMigration1557483560422],
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
