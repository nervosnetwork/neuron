import { controllerMethodWrapper } from './controllerMethodWrapper'

const CONTROLLER_NAME = 'skip-data-and-type'

export const setSkipDataAndType = controllerMethodWrapper(CONTROLLER_NAME)(
  (controller: any) => (params: Controller.SetSkipAndTypeParam) => {
    return controller.update(params)
  }
)

export default { setSkipDataAndType }
