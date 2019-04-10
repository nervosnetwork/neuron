import { createConnection, getConnectionOptions } from 'typeorm'
import env from './env'

import Cell from './entities/Cell'
import Transaction from './entities/Transaction'

const connectOptions = async () => {
  const connectionOptions = await getConnectionOptions()
  Object.assign(connectionOptions, {
    database: env.dbPath,
    entities: [Cell, Transaction],
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

export default generateConnection
