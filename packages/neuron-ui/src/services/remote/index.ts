export * from './app'
export * from './wallets'
export * from './networks'
export * from './transactions'
export * from './skipDataAndType'

export const getLocale = () => {
  if (!window.remote) {
    console.warn('remote is not supported')
    return window.navigator.language
  }
  return window.remote.require('electron').app.getLocale()
}

export const getWinID = () => {
  if (!window.remote) {
    console.warn('remote is not supported')
    return -1
  }
  return window.remote.getCurrentWindow().id
}

export const validateMnemonic = (mnemonic: string): boolean => {
  if (!window.remote) {
    console.warn('remote is not supported')
    return true
  }
  const { validateMnemonic: remoteValidateMnemonic } = window.remote.require('./models/keys/mnemonic')
  return remoteValidateMnemonic(mnemonic)
}

export const generateMnemonic = (): string => {
  if (!window.remote) {
    console.warn('remote is not supported')
    return ''
  }
  const { generateMnemonic: remoteGenerateMnemonic } = window.remote.require('./models/keys/key')
  return remoteGenerateMnemonic()
}

export const showMessage = (options: any, callback: Function) => {
  if (!window.remote) {
    console.warn('remote is not supported')
    window.alert(options.message)
  } else {
    window.remote.require('electron').dialog.showMessageBox(options, callback)
  }
}

export const showErrorMessage = (title: string, content: string) => {
  if (!window.remote) {
    console.warn('remote is not supported')
    window.alert(`${title}: ${content}`)
  } else {
    window.remote.require('electron').dialog.showErrorBox(title, content)
  }
}

export const showOpenDialog = (opt: { title: string; message?: string; onUpload: Function }) => {
  if (!window.remote) {
    window.alert('remote is not supported')
  }
  const { onUpload, ...options } = opt
  return window.remote.require('electron').dialog.showOpenDialog(
    {
      ...options,
    },
    onUpload
  )
}

export default {
  getLocale,
  validateMnemonic,
  generateMnemonic,
  showMessage,
  showErrorMessage,
  showOpenDialog,
  getWinID,
}
