import { remoteApi } from './remoteApiWrapper'

export const getAllNetworks = remoteApi<void>('get-all-networks')
export const createNetwork = remoteApi<Controller.CreateNetworkParams>('create-network')
export const updateNetwork = remoteApi<Controller.UpdateNetworkParams>('update-network')
export const getCurrentNetworkID = remoteApi<void>('get-current-network-id')
export const setCurrentNetowrk = remoteApi<string>('set-current-network-id')
export const deleteNetwork = remoteApi<string>('delete-network')
