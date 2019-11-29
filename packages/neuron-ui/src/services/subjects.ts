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
    | 'system-script-updated'
    | 'data-updated'
    | 'current-wallet-updated'
    | 'wallet-list-updated'
    | 'current-network-id-updated'
    | 'network-list-updated'
    | 'connection-status-updated'
    | 'synced-block-number-updated'
    | 'command'
    | 'app-updater-updated'
) => {
  return window.ipcRenderer
    ? {
        subscribe: (handler: (data: T) => void) => {
          window.ipcRenderer.on(channel, (_e: Event, data: T) => {
            handler(data)
          })
          return {
            unsubscribe: () => {
              window.ipcRenderer.removeAllListeners(channel)
            },
          }
        },
      }
    : FallbackSubject
}
export const SystemScript = SubjectConstructor<Subject.SystemScript>('system-script-updated')
export const DataUpdate = SubjectConstructor<Subject.DataUpdateMetaInfo>('data-updated')
export const CurrentWallet = SubjectConstructor<any>('current-wallet-updated')
export const WalletList = SubjectConstructor<any[]>('wallet-list-updated')
export const NetworkList = SubjectConstructor<Subject.NetworkList>('network-list-updated')
export const CurrentNetworkID = SubjectConstructor<Subject.CurrentNetworkID>('current-network-id-updated')
export const ConnectionStatus = SubjectConstructor<Subject.ConnectionStatus>('connection-status-updated')
export const SyncedBlockNumber = SubjectConstructor<Subject.BlockNumber>('synced-block-number-updated')
export const AppUpdater = SubjectConstructor<Subject.AppUpdater>('app-updater-updated')
export const Command = SubjectConstructor<Subject.CommandMetaInfo>('command')

export default {
  SystemScript,
  DataUpdate,
  CurrentWallet,
  WalletList,
  NetworkList,
  CurrentNetworkID,
  ConnectionStatus,
  SyncedBlockNumber,
  AppUpdater,
  Command,
}
