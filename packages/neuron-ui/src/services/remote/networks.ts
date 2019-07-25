import { controllerMethodWrapper } from './controllerMethodWrapper'

const CONTROLLER_NAME = 'networks'

export const setCurrentNetowrk = controllerMethodWrapper(CONTROLLER_NAME)((controller: any) => (networkID: string) => {
  return controller.activate(networkID)
})

export const createNetwork = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (params: Controller.CreateNetworkParams) => {
    return controller.create(params)
  }
)

export const updateNetwork = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => ({ networkID, options }: Controller.UpdateNetworkParams) => {
    return controller.update(networkID, options)
  }
)

export default {
  createNetwork,
  updateNetwork,
  setCurrentNetowrk,
}
