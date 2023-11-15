import logger from 'electron-log'
import env from '../env'

if (!env.isDevMode) {
  logger.transports.file.level = 'info'
}
logger.transports.file.format = '[{iso}] [{level}] {text}'

logger.transports.console.format = '[{iso}] [{level}] {text}'

// logger.catchErrors({ showDialog: false })

export default logger
