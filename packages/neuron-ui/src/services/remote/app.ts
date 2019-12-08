import { apiWrapper } from './apiMethodWrapper'

export const getNeuronWalletState = apiWrapper<void>('load-init-data')
export const openInWindow = apiWrapper<Controller.OpenInWindowParams>('open-in-window')
export const handleViewError = apiWrapper<string>('handle-view-error')

export const clearCellCache = apiWrapper<void>('clear-cache')
