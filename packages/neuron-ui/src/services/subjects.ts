import { CONSTANTS } from 'utils'
import { ipcRenderer, type IpcRendererEvent } from 'electron'

const { LOCALES } = CONSTANTS

const FallbackSubject = {
  subscribe: (args: any) => {
    console.warn('The remote module is not found, please make sure the UI is running inside the Electron App')
    console.info(JSON.stringify(args))
    return {
      unsubscribe: () => {
        console.info('unsubscribe')
      },
    }
  },
}

const SubjectConstructor = <T>(
  channel:
    | 'data-updated'
    | 'current-wallet-updated'
    | 'wallet-list-updated'
    | 'current-network-id-updated'
    | 'network-list-updated'
    | 'connection-status-updated'
    | 'sync-estimate-updated'
    | 'command'
    | 'app-updater-updated'
    | 'navigation'
    | 'set-locale'
    | 'device-sign-index'
    | 'multisig-output-update'
    | 'migrate'
    | 'show-global-dialog',
  isMulti?: boolean
) => {
  return ipcRenderer
    ? {
        subscribe: (handler: (data: T) => void) => {
          const handlerWrap = (_e: IpcRendererEvent, data: T) => {
            handler(data)
          }
          ipcRenderer.on(channel, handlerWrap)
          return {
            unsubscribe: () => {
              if (isMulti) {
                ipcRenderer.removeListener(channel, handlerWrap)
              } else {
                ipcRenderer.removeAllListeners(channel)
              }
            },
          }
        },
      }
    : FallbackSubject
}
export const DataUpdate = SubjectConstructor<Subject.DataUpdateMetaInfo>('data-updated')
export const CurrentWallet = SubjectConstructor<any>('current-wallet-updated')
export const WalletList = SubjectConstructor<any[]>('wallet-list-updated')
export const NetworkList = SubjectConstructor<Subject.NetworkList>('network-list-updated')
export const CurrentNetworkID = SubjectConstructor<Subject.CurrentNetworkID>('current-network-id-updated')
export const ConnectionStatus = SubjectConstructor<Subject.ConnectionStatus>('connection-status-updated')
export const SyncState = SubjectConstructor<Subject.SyncState>('sync-estimate-updated')
export const AppUpdater = SubjectConstructor<Subject.AppUpdater>('app-updater-updated')
export const Command = SubjectConstructor<Subject.CommandMetaInfo>('command')
export const ShowGlobalDialog = SubjectConstructor<Subject.GlobalDialog>('show-global-dialog')
export const Navigation = SubjectConstructor<Subject.URL>('navigation')
export const SetLocale = SubjectConstructor<(typeof LOCALES)[number]>('set-locale')
export const DeviceSignIndex = SubjectConstructor<Subject.SignIndex>('device-sign-index')
export const MultisigOutputUpdate = SubjectConstructor<string>('multisig-output-update')
export const Migrate = SubjectConstructor<'need-migrate' | 'migrating' | 'failed' | 'finish'>('migrate', true)

export default {
  DataUpdate,
  CurrentWallet,
  WalletList,
  NetworkList,
  CurrentNetworkID,
  ConnectionStatus,
  SyncState,
  AppUpdater,
  Command,
  Navigation,
  SetLocale,
  DeviceSignIndex,
  MultisigOutputUpdate,
  Migrate,
}
