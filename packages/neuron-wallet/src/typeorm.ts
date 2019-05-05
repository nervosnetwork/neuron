import { createConnection, getConnectionOptions, getConnection } from 'typeorm'
import * as path from 'path'
import app from './app'

import Transaction from './entities/Transaction'
import Input from './entities/Input'
import Output from './entities/Output'
import SyncInfo from './entities/SyncInfo'

import { InitMigration1556975381415 } from './migration/1556975381415-InitMigration'

const userDataPath = app.getPath('userData')

const connectOptions = async (networkName: string) => {
  const dbPath = path.join(userDataPath, `cell-${networkName}.sqlite`)
  const connectionOptions = await getConnectionOptions()
  Object.assign(connectionOptions, {
    database: dbPath,
    entities: [Transaction, Input, Output, SyncInfo],
    migrations: [InitMigration1556975381415],
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
