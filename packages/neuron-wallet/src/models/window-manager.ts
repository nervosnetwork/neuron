import { BrowserWindow } from 'electron'
import { Channel } from '../utils/const'
import logger from '../utils/logger'

const error = { level: 'error', message: 'Electron is not loaded' }

interface SendMessage {
  (channel: Channel.App, method: Controller.AppMethod, params: any): void
  (channel: Channel.Wallets, method: Controller.WalletsMethod | 'allAddresses' | 'sendingStatus', params: any): void
  (channel: Channel.Transactions, method: Controller.TransactionsMethod, params: any): void
  (channel: Channel.Networks, method: Controller.NetworksMethod, params: any): void
  (channel: Channel.Helpers, method: Controller.HelpersMethod, params: any): void
  (channel: Channel.Chain, method: 'status' | 'tipBlockNumber', params: any): void
}

export default class WindowManager {
  public static mainWindow: BrowserWindow | null
  public static broadcast: SendMessage = (channel: Channel, method: string, params: any): void => {
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

  public static sendToFocusedWindow: SendMessage = (channel: Channel, method: string, params: any): void => {
    if (!BrowserWindow) {
      logger.log(error)
      return
    }
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      window.webContents.send(channel, method, params)
    }
  }

  public static sendToMainWindow: SendMessage = (channel: Channel, method: string, params: any): void => {
    if (WindowManager.mainWindow) {
      WindowManager.mainWindow.webContents.send(channel, method, params)
    }
  }
}
