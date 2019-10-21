import { apiMethodWrapper } from './apiMethodWrapper'

export const setSkipDataAndType = apiMethodWrapper((api: any) => (params: Controller.SetSkipAndTypeParam) => {
  return api.updateSkipDataAndType(params)
})

export default { setSkipDataAndType }
