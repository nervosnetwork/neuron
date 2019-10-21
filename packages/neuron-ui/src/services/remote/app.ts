import { apiMethodWrapper } from './apiMethodWrapper'

export const getNeuronWalletState = apiMethodWrapper()(controller => () => controller.loadInitData())

export const handleViewError = apiMethodWrapper()(controller => (errorMessage: string) =>
  controller.handleViewError(errorMessage)
)
export const contextMenu = apiMethodWrapper()(controller => (params: { type: string; id: string }) =>
  controller.contextMenu(params)
)

export default {
  getNeuronWalletState,
  handleViewError,
  contextMenu,
}
