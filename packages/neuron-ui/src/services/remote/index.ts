export * from './app'
export * from './wallets'
export * from './networks'
export * from './transactions'
export * from './updater'

const REMOTE_MODULE_NOT_FOUND =
  'The remote module is not found, please make sure the UI is running inside the Electron App'

export const getLocale = () => {
  if (!window.remote) {
    console.warn(REMOTE_MODULE_NOT_FOUND)
    return window.navigator.language
  }
  return window.remote.require('electron').app.getLocale()
}

export const getWinID = () => {
  if (!window.remote) {
    console.warn(REMOTE_MODULE_NOT_FOUND)
    return -1
  }
  return window.remote.getCurrentWindow().id
}

export const showMessage = (options: any, callback: Function) => {
  if (!window.remote) {
    console.warn(REMOTE_MODULE_NOT_FOUND)
    window.alert(options.message)
  } else {
    window.remote.require('electron').dialog.showMessageBox(options, callback)
  }
}

export const showErrorMessage = (title: string, content: string) => {
  if (!window.remote) {
    console.warn(REMOTE_MODULE_NOT_FOUND)
    window.alert(`${title}: ${content}`)
  } else {
    window.remote.require('electron').dialog.showErrorBox(title, content)
  }
}

export const showOpenDialog = (opt: { title: string; message?: string; onUpload: Function }) => {
  if (!window.remote) {
    window.alert(REMOTE_MODULE_NOT_FOUND)
  }
  const { onUpload, ...options } = opt
  return window.remote.require('electron').dialog.showOpenDialog(
    {
      ...options,
    },
    onUpload
  )
}

export const openExternal = (url: string) => {
  if (!window.remote) {
    window.open(url)
  } else {
    window.remote.require('electron').shell.openExternal(url)
  }
}

export const openContextMenu = (template: { label: string; click: Function }[]): void => {
  if (!window.remote) {
    window.alert(REMOTE_MODULE_NOT_FOUND)
  } else {
    const { Menu } = window.remote.require('electron')
    const menu = Menu.buildFromTemplate(template)
    menu.popup()
  }
}

export default {
  getLocale,
  showMessage,
  showErrorMessage,
  showOpenDialog,
  getWinID,
  openExternal,
  openContextMenu,
}
