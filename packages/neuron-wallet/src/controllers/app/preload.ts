import { remote, clipboard, nativeImage, IpcRenderer, ipcRenderer, shell, desktopCapturer, DesktopCapturer } from 'electron'

declare global {
  interface Window {
    electron: {
      clipboard: Electron.Clipboard
      nativeImage: any
      ipcRenderer: IpcRenderer
      remote: Electron.Remote
      shell: Electron.Shell
      desktopCapturer: DesktopCapturer
    }
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

window.electron = {
  clipboard,
  nativeImage,
  ipcRenderer,
  remote,
  shell,
  desktopCapturer,
}
