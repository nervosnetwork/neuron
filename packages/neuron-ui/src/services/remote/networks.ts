import { controllerMethodWrapper } from './controllerMethodWrapper'

const CONTROLLER_NAME = 'networks'

export const setCurrentNetowrk = controllerMethodWrapper(CONTROLLER_NAME)((controller: any) => (networkID: string) => {
  return controller.activate(networkID)
})

export const createNetwork = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => ({ name, remote }: { name: string; remote: string }) => {
    return controller.create({ name, remote })
  }
)

export const updateNetwork = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => ({ networkID, options }: { networkID: string; options: Partial<{ name: string; remote: string }> }) => {
    return controller.update(networkID, options)
  }
)

export default {
  createNetwork,
  updateNetwork,
  setCurrentNetowrk,
}
