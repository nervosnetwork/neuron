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
) => async (realParams: any): Promise<ControllerResponse> => {
  if (!window.remote) {
    return RemoteNotLoadError
  }
  const controller = window.remote.require(`./controllers/${controllerName}`).default
  if (!controller) {
    return controllerNotLoaded(controllerName)
  }
  const res = await callControllerMethod(controller)(realParams)
  if (res.status) {
    return {
      status: 1,
      result: res.result || true,
    }
  }
  return {
    status: 0,
    message: res.status.msg || '',
  }
}

export default {
  RemoteNotLoadError,
  controllerNotLoaded,
  controllerMethodWrapper,
}
