import { apiMethodWrapper } from './apiMethodWrapper'

export const getNeuronWalletState = apiMethodWrapper<void>(api => () => api.loadInitData())

export const openInWindow = apiMethodWrapper<Controller.OpenInWindowParams>(api => params => api.openInWindow(params))

export const handleViewError = apiMethodWrapper<string>(api => errorMessage => api.handleViewError(errorMessage))

export const clearCellCache = apiMethodWrapper<void>(api => () => api.clearCellCache())

export default {
  getNeuronWalletState,
  openInWindow,
  handleViewError,
  clearCellCache,
}
