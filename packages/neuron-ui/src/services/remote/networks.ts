import { apiMethodWrapper } from './apiMethodWrapper'

export const setCurrentNetowrk = apiMethodWrapper((api: any) => (networkID: string) => {
  return api.setCurrentNetowrk(networkID)
})

export const createNetwork = apiMethodWrapper(api => (params: Controller.CreateNetworkParams) => {
  return api.createNetwork(params)
})

export const updateNetwork = apiMethodWrapper(api => ({ networkID, options }: Controller.UpdateNetworkParams) => {
  return api.updateNetwork(networkID, options)
})

export const getAllNetworks = apiMethodWrapper(api => () => {
  return api.getAllNetworks()
})

export const getCurrentNetworkID = apiMethodWrapper(api => () => {
  return api.getCurrentNetworkID()
})

export default {
  createNetwork,
  updateNetwork,
  setCurrentNetowrk,
  getAllNetworks,
  getCurrentNetworkID,
}
