import { OpenDialogOptions, MenuItemConstructorOptions, MenuItem, Size, OpenDialogReturnValue } from 'electron'
import { LOCALES } from 'utils/const'
import { remoteApi } from './remoteApiWrapper'

export const getSystemCodeHash = remoteApi<void>('get-system-codehash')
export const getNeuronWalletState = remoteApi<void>('load-init-data')
export const openInWindow = remoteApi<Controller.OpenInWindowParams>('open-in-window')
export const requestOpenInExplorer = remoteApi<Controller.RequestOpenInExplorerParams, void>('request-open-in-explorer')
export const handleViewError = remoteApi<string>('handle-view-error')
export const showSettings = remoteApi<Controller.ShowSettingsParams>('show-settings')
export const setLocale = remoteApi<typeof LOCALES[number]>('set-locale')

export const clearCellCache = remoteApi<Controller.ClearCache.Params>('clear-cache')

export const invokeShowErrorMessage = remoteApi<{ title: string; content: string }>('show-error-message')
export const invokeShowOpenDialog = remoteApi<OpenDialogOptions, OpenDialogReturnValue>('show-open-dialog')
export const invokeShowOpenDialogModal = remoteApi<OpenDialogOptions, OpenDialogReturnValue>('show-open-dialog-modal')
export const invokeOpenContextMenu = remoteApi<Array<MenuItemConstructorOptions | MenuItem>>('open-context-menu')
export const invokeGetAllDisplaysSize = remoteApi<void, Size[]>('get-all-displays-size')
