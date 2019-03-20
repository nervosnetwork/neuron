import winston, { format } from 'winston'

const { combine, timestamp, json } = format

const logger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    service: 'neuron-wallet',
  },
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.File({
      filename: 'combined.log',
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
    }),
  ],
})

export default logger
