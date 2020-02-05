import { remote, ipcRenderer, IpcRenderer } from 'electron'

declare global {
  interface Window {
    ipcRenderer: IpcRenderer
    remote: Electron.Remote
  }
}

window.ipcRenderer = ipcRenderer
window.remote = remote

window.require = require
