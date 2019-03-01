import { ipcMain, ipcRenderer, WebContents } from 'electron'

declare global {
  interface Window {
    bridge: any
  }
}

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

if (process.env.NODE_ENV === 'development') {
  Object.defineProperty(window, '__devtron', {
    value: {
      require,
      process,
    },
  })
}

window.bridge = window.bridge || bridge
