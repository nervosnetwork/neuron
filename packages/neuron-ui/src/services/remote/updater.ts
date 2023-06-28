import { remoteApi } from './remoteApiWrapper'

export const checkForUpdates = remoteApi<void>('check-for-updates')
export const downloadUpdate = remoteApi<any>('download-update')
export const installUpdate = remoteApi<any>('quit-and-install-update')
export const migrateData = remoteApi<void>('start-migrate')
