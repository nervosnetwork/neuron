import { remoteApi } from './remoteApiWrapper'

export const getNeuronWalletState = remoteApi<void>('load-init-data')
export const openInWindow = remoteApi<Controller.OpenInWindowParams>('open-in-window')
export const handleViewError = remoteApi<string>('handle-view-error')

export const clearCellCache = remoteApi<void>('clear-cache')
