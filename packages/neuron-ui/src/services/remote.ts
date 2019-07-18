export const validateMnemonic = (mnemonic: string): boolean => {
  if (!window.remote) {
    console.warn('remote is not supported')
    return true
  }
  const { validateMnemonic: remoteValidateMnemonic } = window.remote.require('./models/keys/mnemonic')
  return remoteValidateMnemonic(mnemonic)
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

export default {
  validateMnemonic,
  showMessage,
  showErrorMessage,
}
