import { BrowserWindow } from 'electron'
import { Channel } from './const'

class WindowManage {
  public static broadcast = (channel: Channel, method: string, params: any) => {
    BrowserWindow.getAllWindows().forEach(window => {
      if (window && window.webContents) {
        window.webContents.send(channel, method, params)
      }
    })
  }

  public static sendToFocusedWindow = (channel: Channel, method: string, params: any) => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      window.webContents.send(channel, method, params)
    }
  }
}

export default WindowManage
