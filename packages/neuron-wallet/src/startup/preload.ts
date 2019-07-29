import { remote, clipboard, nativeImage, ipcRenderer, IpcRenderer } from 'electron'

declare global {
  interface Window {
    clipboard: Electron.Clipboard
    nativeImage: any
    ipcRenderer: IpcRenderer
    remote: Electron.Remote
  }
}

if (process.env.NODE_ENV === 'development') {
  Object.defineProperty(window, '__devtron', {
    value: {
      require,
      process,
    },
  })
}

window.clipboard = clipboard
window.nativeImage = nativeImage
window.ipcRenderer = ipcRenderer
window.remote = remote
