import { createConnection, getConnectionOptions } from 'typeorm'
import env from './env'

import Cell from './entities/Cell'

const connectOptions = async () => {
  const connectionOptions = await getConnectionOptions()
  Object.assign(connectionOptions, {
    database: env.dbPath,
    entities: [Cell],
  })

  return connectionOptions
}

export const generateConnection = async (
  func: Function,
  errorFunc: Function = (error: any) => console.error(error),
) => {
  const connectionOptions = await connectOptions()

  createConnection(connectionOptions)
    .then(async () => {
      await func()
    })
    .catch(errorFunc())
}

export default generateConnection
