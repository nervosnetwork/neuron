import { controllerMethodWrapper } from './controllerMethodWrapper'

const CONTROLLER_NAME = 'app'
export const getNeuronWalletState = controllerMethodWrapper(CONTROLLER_NAME)(controller => () =>
  controller.getInitState()
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

export const isMainWindow = controllerMethodWrapper(CONTROLLER_NAME)(controller => (winID: number) =>
  controller.isMainWindow(winID)
)

export default {
  getNeuronWalletState,
  handleViewError,
  contextMenu,
  showTransactionDetails,
  isMainWindow,
}
