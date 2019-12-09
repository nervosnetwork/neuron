import { apiWrapper } from './apiMethodWrapper'

export const getAllNetworks = apiWrapper<void>('get-all-networks')
export const createNetwork = apiWrapper<Controller.CreateNetworkParams>('create-network')
export const updateNetwork = apiWrapper<Controller.UpdateNetworkParams>('update-network')
export const getCurrentNetworkID = apiWrapper<void>('get-current-network-id')
export const setCurrentNetowrk = apiWrapper<string>('set-current-network-id')
export const deleteNetwork = apiWrapper<string>('delete-network')
