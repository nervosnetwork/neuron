import { createConnection, getConnectionOptions } from 'typeorm'
import * as path from 'path'
import app from './app'

import Transaction from './entities/Transaction'
import Input from './entities/Input'
import Output from './entities/Output'
import SyncInfo from './entities/SyncInfo'

import { InitMigration1556975381415 } from './migration/1556975381415-InitMigration'

const dbPath = path.join(app.getPath('userData'), 'cell.sqlite')

const connectOptions = async () => {
  const connectionOptions = await getConnectionOptions()
  Object.assign(connectionOptions, {
    database: dbPath,
    entities: [Transaction, Input, Output, SyncInfo],
    migrations: [InitMigration1556975381415],
  })

  return connectionOptions
}

export const generateConnection = async (
  func: Function,
  errorFunc: Function = (error: any) => console.error(error),
) => {
  const connectionOptions = await connectOptions()

  createConnection(connectionOptions)
    .then(async (connection: any) => {
      await func(connection)
    })
    .catch(errorFunc())
}

export const initConnection = async () => {
  const connectionOptions = await connectOptions()

  createConnection(connectionOptions)
    .then()
    .catch((error: any) => console.error(error))
}

export default initConnection
