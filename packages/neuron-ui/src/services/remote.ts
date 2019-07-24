// TODO: use error code
interface SuccessFromController {
  status: 1
  result: any
}
interface FailureFromController {
  status: 0
  message: {
    title: string
    content?: string
  }
}
type ControllerResponse = SuccessFromController | FailureFromController

const RemoteNotLoadError = {
  status: 0 as 0,
  message: {
    title: 'remote is not supported',
  },
}

const controllerNotLoaded = (controllerName: string) => ({
  status: 0 as 0,
  message: {
    title: `${controllerName} controller not loaded`,
  },
})

export const initWindow = () => {
  if (!window.remote) {
    console.warn('remote is not supported')
    return Promise.reject(new Error('remote is not supported'))
  }
  const appController = window.remote.require('./controllers/app').default
  return appController.getInitState()
}

export const validateMnemonic = (mnemonic: string): boolean => {
  if (!window.remote) {
    console.warn('remote is not supported')
    return true
  }
  const { validateMnemonic: remoteValidateMnemonic } = window.remote.require('./models/keys/mnemonic')
  return remoteValidateMnemonic(mnemonic)
}

export const setCurrentNetowrk = async (networkID: string): Promise<ControllerResponse> => {
  if (!window.remote) {
    return RemoteNotLoadError
  }
  const networkController = window.remote.require('./controllers/networks').default
  if (networkController) {
    const res = await networkController.activate(networkID)
    if (res.status) {
      return {
        status: 1,
        result: true,
      }
    }
    return {
      status: 0,
      message: res.status.msg || '',
    }
  }
  return controllerNotLoaded('network')
}

export const createNetwork = async ({
  name,
  remote,
}: {
  name: string
  remote: string
}): Promise<ControllerResponse> => {
  if (!window.remote) {
    return RemoteNotLoadError
  }
  const networkController = window.remote.require('./controllers/networks').default
  if (networkController) {
    const res = await networkController.create({ name, remote })
    if (res.status) {
      return {
        status: 1,
        result: true,
      }
    }
    return {
      status: 0,
      message: res.status.msg || '',
    }
  }
  return controllerNotLoaded('network')
}

export const updateNetwork = async (
  networkID: string,
  options: Partial<{ name: string; remote: string }>
): Promise<ControllerResponse> => {
  if (!window.remote) {
    return RemoteNotLoadError
  }
  const networkController = window.remote.require('./controllers/networks').default
  if (networkController) {
    const res = await networkController.update(networkID, options)
    if (res.status) {
      return {
        status: 1,
        result: true,
      }
    }
    return {
      status: 0,
      message: res.status.msg || '',
    }
  }
  return controllerNotLoaded('network')
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
  initWindow,
  validateMnemonic,
  setCurrentNetowrk,
  showMessage,
  showErrorMessage,
}
