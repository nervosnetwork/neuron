import { ipcRenderer } from 'electron'

declare global {
  interface Window {
    bridge: any
  }
}

const bridge = {
  ipcRenderer: {
    send: (channel: string, args: any = '') => ipcRenderer.send(channel, args),
    on: (channel: string, cb: Function) => {
      ipcRenderer.on(channel, cb)
    },
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
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
