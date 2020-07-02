import { LOCALES } from 'utils/const'
import { remoteApi } from './remoteApiWrapper'

export const getSystemCodeHash = remoteApi<void>('get-system-codehash')
export const getNeuronWalletState = remoteApi<void>('load-init-data')
export const openInWindow = remoteApi<Controller.OpenInWindowParams>('open-in-window')
export const handleViewError = remoteApi<string>('handle-view-error')
export const showSettings = remoteApi<Controller.ShowSettingsParams>('show-settings')
export const setLocale = remoteApi<typeof LOCALES[number]>('set-locale')

export const clearCellCache = remoteApi<Controller.ClearCache.Params>('clear-cache')
