import { apiMethodWrapper } from './apiMethodWrapper'

export const getNeuronWalletState = apiMethodWrapper<void>(api => () => api.loadInitData())

export const handleViewError = apiMethodWrapper<string>(api => errorMessage => api.handleViewError(errorMessage))
export const contextMenu = apiMethodWrapper<{ type: string; id: string }>(api => params => api.contextMenu(params))

export const checkForUpdates = apiMethodWrapper<void>(api => () => api.checkForUpdates())
export const clearCellCache = apiMethodWrapper<void>(api => () => api.clearCellCache())

export default {
  getNeuronWalletState,
  handleViewError,
  contextMenu,
  checkForUpdates,
  clearCellCache,
}
