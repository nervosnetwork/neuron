interface SuccessFromController {
  status: 1
  result: any
}
interface FailureFromController {
  status: 0
  message:
    | string
    | {
        content?: string
        meta?: { [key: string]: string }
      }
}

export type ControllerResponse = SuccessFromController | FailureFromController

export const RemoteNotLoadError = {
  status: 0 as 0,
  message: {
    content: 'The remote module is not found, please make sure the UI is running inside the Electron App',
  },
}

export const apiMethodWrapper = <T = any>(
  callControllerMethod: (controller: any) => (params: T) => Promise<string>
) => async (realParams: T): Promise<ControllerResponse> => {
  if (!window.remote) {
    return RemoteNotLoadError
  }
  const controller = window.remote.require('./controllers/api').default
  if (!controller) {
    return {
      status: 0,
      message: {
        content: 'api controller not loaded',
      },
    }
  }

  const res: SuccessFromController | FailureFromController = await callControllerMethod(controller)(realParams)
    .then(stringifiedRes => (stringifiedRes ? JSON.parse(stringifiedRes) : stringifiedRes))
    .catch(() => ({
      status: 0,
      message: {
        content: 'Invalid response format',
      },
    }))

  if (process.env.NODE_ENV === 'development' && window.localStorage.getItem('log-response')) {
    console.group(callControllerMethod)
    console.info(`params: ${JSON.stringify(realParams, null, 2)}`)
    console.info(`res: ${JSON.stringify(res, null, 2)}`)
    console.groupEnd()
  }

  if (!res) {
    return {
      status: 1,
      result: null,
    }
  }

  if (res.status === 1) {
    return {
      status: 1,
      result: res.result || null,
    }
  }

  return {
    status: res.status || 0,
    message: typeof res.message === 'string' ? { content: res.message } : res.message || '',
  }
}

// New API wrapper using Electron 7 invoke/handle
// Action: Electron channel
type Action =
  | 'get-transaction-list'
  | 'get-dao-cells'
  | 'check-for-updates'
  | 'download-update'
  | 'quit-and-install'
  | 'clear-cache'

export const apiWrapper = <T = any>(action: Action) => async (params: T): Promise<ControllerResponse> => {
  const res: SuccessFromController | FailureFromController = await window.ipcRenderer
    .invoke(action, params)
    .then(stringifiedRes => (stringifiedRes ? JSON.parse(stringifiedRes) : stringifiedRes))
    .catch(() => ({
      status: 0,
      message: {
        content: 'Invalid response format',
      },
    }))

  if (process.env.NODE_ENV === 'development' && window.localStorage.getItem('log-response')) {
    console.group(action)
    console.info(`params: ${JSON.stringify(params, null, 2)}`)
    console.info(`res: ${JSON.stringify(res, null, 2)}`)
    console.groupEnd()
  }

  if (!res) {
    return {
      status: 1,
      result: null,
    }
  }

  if (res.status === 1) {
    return {
      status: 1,
      result: res.result || null,
    }
  }

  return {
    status: res.status || 0,
    message: typeof res.message === 'string' ? { content: res.message } : res.message || '',
  }
}

export default {
  apiMethodWrapper,
  apiWrapper,
}
