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

  public remove = (id: number) => {
    this.windows = this.windows.filter(w => w.id !== id)
  }

  public broadcast = (channel: Channel, method: string, params: any) => {
    this.windows.forEach(window => {
      if (window && window.webContents) {
        window.webContents.send(channel, method, params)
      }
    })
  }
}

export default WindowManage
