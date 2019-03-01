import { ipcMain, ipcRenderer, WebContents } from 'electron'

const bridge = {
  ipcMain: {
    send: (webContents: WebContents, channel: any, data: any) => webContents.send(channel, data),
    on: (channel: any, cb: Function) => {
      ipcMain.on(channel, cb)
    },
  },

  ipcRenderer: {
    send: (channel: string, args: any = '') => ipcRenderer.send(channel, args),
    on: (channel: string, cb: Function) => {
      ipcRenderer.on(channel, cb)
    },
  },
}

declare global {
  interface Window {
    bridge: any
  }
}

window.bridge = window.bridge || bridge
