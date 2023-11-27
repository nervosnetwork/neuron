/* eslint-disable no-alert */
import { ipcRenderer, shell, OpenDialogOptions, MenuItemConstructorOptions, MenuItem } from 'electron'
import { invokeShowErrorMessage, invokeShowOpenDialog, invokeShowOpenDialogModal, invokeOpenContextMenu } from './app'

export * from './app'
export * from './wallets'
export * from './networks'
export * from './transactions'
export * from './specialAssets'
export * from './updater'
export * from './sudt'
export * from './cheque'
export * from './hardware'
export * from './offline'
export * from './nft'
export * from './multisig'
export * from './walletConnect'
export * from './cellManage'

const REMOTE_MODULE_NOT_FOUND =
  'The remote module is not found, please make sure the UI is running inside the Electron App'

export const getLocale = () => {
  // While render process modules must be accessible in Electron,
  // this validation cannot be removed, as other developers may be running this code in their browsers.
  if (ipcRenderer === undefined) {
    console.warn(REMOTE_MODULE_NOT_FOUND)
    return window.navigator.language
  }
  return ipcRenderer.sendSync('get-locale')
}

export const getVersion = () => {
  return ipcRenderer.sendSync('get-version') ?? ''
}

export const getPlatform = () => {
  return ipcRenderer.sendSync('get-platform') ?? 'Unknown'
}

export const getWinID = () => {
  if (ipcRenderer === undefined) {
    console.warn(REMOTE_MODULE_NOT_FOUND)
    return -1
  }
  return ipcRenderer.sendSync('get-win-id')
}

export const showErrorMessage = (title: string, content: string) => {
  if (ipcRenderer === undefined) {
    console.warn(REMOTE_MODULE_NOT_FOUND)
    window.alert(`${title}: ${content}`)
  }
  invokeShowErrorMessage({ title, content })
}

export const showOpenDialog = (options: OpenDialogOptions) => {
  if (ipcRenderer === undefined) {
    window.alert(REMOTE_MODULE_NOT_FOUND)
    return Promise.reject()
  }
  return invokeShowOpenDialog(options)
}

export const showOpenDialogModal = (options: OpenDialogOptions) => {
  if (ipcRenderer === undefined) {
    window.alert(REMOTE_MODULE_NOT_FOUND)
    return Promise.reject()
  }
  return invokeShowOpenDialogModal(options)
}

export const openExternal = (url: string) => {
  if (shell === undefined) {
    window.open(url)
  } else {
    shell.openExternal(url)
  }
}

export const openContextMenu = (template: Array<MenuItemConstructorOptions | MenuItem>): void => {
  if (ipcRenderer === undefined) {
    window.alert(REMOTE_MODULE_NOT_FOUND)
  } else {
    invokeOpenContextMenu(template)
  }
}

export default {
  getLocale,
  showErrorMessage,
  showOpenDialog,
  getWinID,
  openExternal,
  openContextMenu,
}
