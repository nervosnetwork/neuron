import { BrowserWindow } from 'electron'
import { Channel } from './const'
import logger from './logger'

const error = { level: 'error', message: 'Electron is not loaded' }

class WindowManage {
  public static broadcast = (channel: Channel, method: string, params: any): void => {
    if (!BrowserWindow) {
      logger.log(error)
      return
    }
    BrowserWindow.getAllWindows().forEach(window => {
      if (window && window.webContents) {
        window.webContents.send(channel, method, params)
      }
    })
  }

  public static sendToFocusedWindow = (channel: Channel, method: string, params: any): void => {
    if (!BrowserWindow) {
      logger.log(error)
      return
    }
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      window.webContents.send(channel, method, params)
    }
  }
}

export default WindowManage
