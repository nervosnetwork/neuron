import { app } from 'electron'
import winston, { format } from 'winston'
import path from 'path'
import env from '../env'

const { isDevMode } = env
const basePath = isDevMode ? './' : `${app.getPath('logs')}`

const { combine, timestamp, json } = format

const logger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    service: 'neuron-wallet',
  },
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.File({
      filename: path.resolve(basePath, 'combined.log'),
    }),
    new winston.transports.File({
      filename: path.resolve(basePath, 'error.log'),
      level: 'error',
    }),
  ],
})

export default logger
