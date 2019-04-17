import { app } from 'electron'
import winston, { format } from 'winston'
import env from '../env'

const { isDevMode } = env
const path = isDevMode ? '' : `${app.getPath('userData')}/`

const { combine, timestamp, json } = format

const logger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    service: 'neuron-wallet',
  },
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.File({
      filename: `${path}combined.log`,
    }),
    new winston.transports.File({
      filename: `${path}error.log`,
      level: 'error',
    }),
  ],
})

logger.log({
  level: 'error',
  message: 'Hello distributed log files!',
})

export default logger
