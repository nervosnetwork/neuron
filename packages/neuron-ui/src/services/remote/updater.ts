import { apiMethodWrapper, apiWrapper } from './apiMethodWrapper'

export const checkForUpdates = apiWrapper<void>('check-for-updates')
export const downloadUpdate = apiMethodWrapper<void>(api => () => api.downloadUpdate())
export const installUpdate = apiMethodWrapper<void>(api => () => api.quitAndInstall())

export default {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
}
