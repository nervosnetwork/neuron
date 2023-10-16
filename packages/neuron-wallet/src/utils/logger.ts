import logger from 'electron-log'
import env from '../env'

if (!env.isDevMode) {
  logger.transports.file.level = 'info'
}
logger.transports.file.format = ({ date, level, data }) => {
  return `[${date.toISOString()}] [${level}] ${data}`
}
logger.transports.console.format = ({ date, level, data }) => {
  return `[${date.toISOString()}] [${level}] ${data}`
}
// logger.catchErrors({ showDialog: false })

export default logger
