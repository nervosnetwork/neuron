import { remoteApi } from './remoteApiWrapper'

export const checkForUpdates = remoteApi<void>('check-for-updates')
export const downloadUpdate = remoteApi<void>('download-update')
export const installUpdate = remoteApi<void>('quit-and-install-update')
