import { apiMethodWrapper } from './apiMethodWrapper'

export const getNeuronWalletState = apiMethodWrapper<void>(controller => () => controller.loadInitData())

export const handleViewError = apiMethodWrapper<string>(controller => errorMessage =>
  controller.handleViewError(errorMessage)
)
export const contextMenu = apiMethodWrapper<{ type: string; id: string }>(controller => params =>
  controller.contextMenu(params)
)

export default {
  getNeuronWalletState,
  handleViewError,
  contextMenu,
}
