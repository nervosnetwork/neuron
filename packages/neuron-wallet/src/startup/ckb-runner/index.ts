import { BrowserWindow } from 'electron'
import path from 'path'
import logger from 'utils/logger'

let backgroundWindow: BrowserWindow | null

export const createCkbRunnerTask = () => {
  if (backgroundWindow) {
    return
  }

  logger.info('Start CKB runner background process')
  backgroundWindow = new BrowserWindow({
    width: 100,
    height: 100,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    }
  })

  backgroundWindow.on('closed', () => {
    logger.info('CKB runner background process closed')
    // TODO: terminate ckb node
    backgroundWindow = null
  })

  backgroundWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`)

  return backgroundWindow
}

export const killCkbRunnerTask = () => {
  if (backgroundWindow) {
    logger.info('Kill CKB runner background process')
    backgroundWindow.close()
  }
}
