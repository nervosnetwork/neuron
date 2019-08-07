import logger from 'electron-log'
import env from 'env'

if (!env.isDevMode) {
  logger.transports.file.level = 'warn'
}

export default logger
