import { BrowserWindow } from 'electron'
import { Channel } from './const'

class WindowManage {
  public windows: BrowserWindow[]

  constructor() {
    this.windows = []
  }

  public add = (win: BrowserWindow) => {
    this.windows.push(win)
  }

  // public remove = ()
  public broad = (channel: Channel, method: string, params: any) => {
    this.windows.forEach(window => {
      if (window) {
        window.webContents.send(channel, method, params)
      }
    })
  }
}

export default WindowManage
