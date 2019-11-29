import { apiMethodWrapper } from './apiMethodWrapper'

export const checkForUpdates = apiMethodWrapper<void>(api => () => api.checkForUpdates())
export const downloadUpdate = apiMethodWrapper<void>(api => () => api.downloadUpdate())
export const installUpdate = apiMethodWrapper<void>(api => () => api.quitAndInstall())

export default {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
}
