import { apiMethodWrapper } from './apiMethodWrapper'

export const setCurrentNetowrk = apiMethodWrapper<string>(api => networkID => {
  return api.setCurrentNetowrk(networkID)
})

export const createNetwork = apiMethodWrapper<Controller.CreateNetworkParams>(api => params => {
  return api.createNetwork(params)
})

export const updateNetwork = apiMethodWrapper<Controller.UpdateNetworkParams>(api => ({ networkID, options }) => {
  return api.updateNetwork(networkID, options)
})

export const getAllNetworks = apiMethodWrapper<void>(api => () => {
  return api.getAllNetworks()
})

export const getCurrentNetworkID = apiMethodWrapper<void>(api => () => {
  return api.getCurrentNetworkID()
})

export default {
  createNetwork,
  updateNetwork,
  setCurrentNetowrk,
  getAllNetworks,
  getCurrentNetworkID,
}
