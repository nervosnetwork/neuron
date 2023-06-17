import {
  OpenDialogOptions,
  MenuItemConstructorOptions,
  MenuItem,
  Size,
  OpenDialogReturnValue,
  MessageBoxOptions,
  MessageBoxReturnValue,
} from 'electron'
import { LOCALES } from 'utils/const'
import { remoteApi } from './remoteApiWrapper'

export const getSystemCodeHash = remoteApi<void>('get-system-codehash')
export const getNeuronWalletState = remoteApi<void>('load-init-data')
export const openInWindow = remoteApi<Controller.OpenInWindowParams>('open-in-window')
export const requestOpenInExplorer = remoteApi<Controller.RequestOpenInExplorerParams, void>('request-open-in-explorer')
export const handleViewError = remoteApi<string>('handle-view-error')
export const setLocale = remoteApi<(typeof LOCALES)[number]>('set-locale')
export const getCkbNodeDataPath = remoteApi<void, string>('get-ckb-node-data-path')
export const setCkbNodeDataPath =
  remoteApi<{ dataPath: string; clearCache?: boolean }, string>('set-ckb-node-data-path')
export const stopProcessMonitor = remoteApi<'ckb'>('stop-process-monitor')
export const startProcessMonitor = remoteApi<'ckb'>('start-process-monitor')
export const getIsCkbRunExternal = remoteApi<void, boolean>('is-ckb-run-external')

export const clearCellCache = remoteApi<Controller.ClearCache.Params>('clear-cache')

export const invokeShowErrorMessage = remoteApi<{ title: string; content: string }>('show-error-message')
export const invokeShowOpenDialog = remoteApi<OpenDialogOptions, OpenDialogReturnValue>('show-open-dialog')
export const invokeShowOpenDialogModal = remoteApi<OpenDialogOptions, OpenDialogReturnValue>('show-open-dialog-modal')
export const invokeOpenContextMenu = remoteApi<Array<MenuItemConstructorOptions | MenuItem>>('open-context-menu')
export const invokeGetAllDisplaysSize = remoteApi<void, Size[]>('get-all-displays-size')
export const invokeShowMessageBox = remoteApi<MessageBoxOptions, MessageBoxReturnValue>('show-message-box')
export const isDark = remoteApi<void, boolean>('is-dark')
export const setTheme = remoteApi<'light' | 'dark', void>('set-theme')
