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
export type ControllerResponse = SuccessFromController | FailureFromController

export const RemoteNotLoadError = {
  status: 0 as 0,
  message: {
    title: 'remote is not supported',
  },
}

export const controllerNotLoaded = (controllerName: string) => ({
  status: 0 as 0,
  message: {
    title: `${controllerName} controller not loaded`,
  },
})

export const controllerMethodWrapper = (controllerName: string) => (
  callControllerMethod: (controller: any) => (params: any) => Promise<{ status: any; result: any; msg: string }>
) => async (realParams?: any): Promise<ControllerResponse> => {
  if (!window.remote) {
    return RemoteNotLoadError
  }
  const controller = window.remote.require(`./controllers/${controllerName}`).default
  if (!controller) {
    return controllerNotLoaded(controllerName)
  }
  const res = await callControllerMethod(controller)(realParams)
  if (process.env.NODE_ENV === 'development' && window.localStorage.getItem('log-response')) {
    /* eslint-disable no-console */
    console.group(`${controllerName} controller`)
    console.info(JSON.stringify(res, null, 2))
    console.groupEnd()
    /* eslint-enable no-console */
  }
  if (!res) {
    return {
      status: 1,
      result: null,
    }
  }
  if (res.status) {
    return {
      status: 1,
      result: res.result || null,
    }
  }
  return {
    status: 0,
    message: { title: (res && res.msg) || '' },
  }
}

export default {
  RemoteNotLoadError,
  controllerNotLoaded,
  controllerMethodWrapper,
}
