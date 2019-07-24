import { controllerMethodWrapper } from './controllerMethodWrapper'

const CONTROLLER_NAME = 'app'

export const handleViewError = controllerMethodWrapper(CONTROLLER_NAME)(controller => (errorMessage: string) =>
  controller.handleViewError(errorMessage)
)
export const contextMenu = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (params: { type: string; id: string }) => controller.contextMenu(params)
)

export default {
  handleViewError,
  contextMenu,
}
