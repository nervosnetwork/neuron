import { BrowserWindow, ipcMain, BrowserWindowConstructorOptions } from 'electron'
import url from 'url'
import path from 'path'
import i18n from '../i18n'

const cleanup = (win: BrowserWindow | null) => {
  if (win) {
    win.close()
  }
}

const passwordLabels = {
  label: i18n.t('prompt.password.label'),
  submit: i18n.t('prompt.password.submit'),
  cancel: i18n.t('prompt.password.cancel'),
}

const prompt = (type = 'password', browserOptions: BrowserWindowConstructorOptions = {}) => {
  let win: BrowserWindow | null = null

  const id = `${Date.now()}${Math.round(Math.random() * 100)}`
  const labels = passwordLabels
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
      show: false,
      ...browserOptions,
    }

    win = new BrowserWindow({
      ...options,
      webPreferences: {
        nodeIntegration: true,
      },
    })

    win.on(`ready-to-show`, () => {
      if (win) {
        win.show()
        win.focus()
        win.webContents.send(`prompt-init`, labels)
      }
    })

    win.setMenu(null)

    const dataHandler = (_e: Event, data: string) => {
      cleanup(win)
      resolve(data)
    }

    const cancelHandler = () => {
      cleanup(win)
      resolve(null)
    }

    ipcMain.on(`prompt-data-${id}`, dataHandler)
    ipcMain.on(`prompt-cancel-${id}`, cancelHandler)

    win.on('closed', () => {
      ipcMain.removeListener(`prompt-data-${id}`, dataHandler)
      ipcMain.removeListener(`prompt-cancel-${id}`, cancelHandler)
    })

    const promptUrl = url.format({
      protocol: 'file',
      slashes: true,
      pathname: path.join(__dirname, type, 'index.html'),
      hash: id,
    })

    win.loadURL(promptUrl)
  })
}

export default prompt
