import { controllerMethodWrapper } from './controllerMethodWrapper'

const CONTROLLER_NAME = 'api'
export const getNeuronWalletState = controllerMethodWrapper(CONTROLLER_NAME)(controller => () =>
  controller.loadInitData()
)

export const handleViewError = controllerMethodWrapper(CONTROLLER_NAME)(controller => (errorMessage: string) =>
  controller.handleViewError(errorMessage)
)
export const contextMenu = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (params: { type: string; id: string }) => controller.contextMenu(params)
)

export const showTransactionDetails = controllerMethodWrapper(CONTROLLER_NAME)(controller => (hash: string) =>
  controller.showTransactionDetails(hash)
)

export default {
  getNeuronWalletState,
  handleViewError,
  contextMenu,
  showTransactionDetails,
}
