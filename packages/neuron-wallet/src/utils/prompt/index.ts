import { BrowserWindow, ipcMain, BrowserWindowConstructorOptions } from 'electron'
import url from 'url'
import path from 'path'

let promptWindow: BrowserWindow | null = null

const cleanup = () => {
  if (promptWindow) {
    promptWindow.close()
    promptWindow = null
  }
}

const prompt = (type = 'password', browserOptions: BrowserWindowConstructorOptions = {}) => {
  return new Promise(resolve => {
    const options = {
      width: 500,
      height: 400,
      resizable: false,
      title: type,
      label: 'Please input a value',
      alwaysOnTop: false,
      value: null,
      type: 'inptu',
      selectOptions: null,
      useHtmlLabel: false,
      customStylesheet: null,
      ...browserOptions,
    }

    promptWindow = new BrowserWindow({
      ...options,
      webPreferences: {
        nodeIntegration: true,
      },
    })

    promptWindow.setMenu(null)

    const dataHandler = (_e: Event, data: string) => {
      cleanup()
      resolve(data)
    }

    const cancelHandler = () => {
      cleanup()
      resolve(null)
    }

    ipcMain.on(`prompt-data`, dataHandler)
    ipcMain.on(`prompt-cancel`, cancelHandler)

    promptWindow.on('closed', () => {
      ipcMain.removeListener(`prompt-data`, dataHandler)
      ipcMain.removeListener(`prompt-cancel`, cancelHandler)
    })

    const promptUrl = url.format({
      protocol: 'file',
      slashes: true,
      pathname: path.join(__dirname, type, 'index.html'),
    })

    promptWindow.loadURL(promptUrl)
  })
}

export default prompt
