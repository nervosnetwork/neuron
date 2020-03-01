import logger from 'electron-log'
import env from 'env'

if (!env.isDevMode) {
  logger.transports.file.level = 'info'
}

// logger.catchErrors({ showDialog: false })

export default logger
