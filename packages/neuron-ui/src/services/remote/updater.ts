import { apiWrapper } from './apiMethodWrapper'

export const checkForUpdates = apiWrapper<void>('check-for-updates')
export const downloadUpdate = apiWrapper<void>('download-update')
export const installUpdate = apiWrapper<void>('quit-and-install-update')
