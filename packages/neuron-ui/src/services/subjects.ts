const SUBJECT_PATH = `./models/subjects`

const FallbackSubject = {
  subscribe: (args: any) => {
    console.warn('remote is not supported')
    console.info(JSON.stringify(args))
    return {
      unsubscribe: () => {
        console.info('unsubscribe')
      },
    }
  },
  unsubscribe: () => {
    console.info('unsubscribe')
  },
}
export const SystemScript = window.remote
  ? (window.remote.require(`${SUBJECT_PATH}/system-script`).default as NeuronWalletSubject<{ codeHash: string }>)
  : FallbackSubject

export const DataUpdate = window.remote
  ? (window.remote.require(`${SUBJECT_PATH}/data-update`).default as NeuronWalletSubject<{
      dataType: 'address' | 'transaction' | 'wallet' | 'network'
      actionType: 'create' | 'update' | 'delete'
      walletID?: string
    }>)
  : FallbackSubject

export const NetworkList = window.remote
  ? (window.remote.require(`${SUBJECT_PATH}/networks`).NetworkListSubject as NeuronWalletSubject<{
      currentNetworkList: State.Network[]
    }>)
  : FallbackSubject

export const CurrentNetworkID = window.remote
  ? (window.remote.require(`${SUBJECT_PATH}/networks`).CurrentNetworkIDSubject as NeuronWalletSubject<{
      currentNetworkID: string
    }>)
  : FallbackSubject

export const ConnectionStatus = window.remote
  ? (window.remote.require(`${SUBJECT_PATH}/node`).ConnectionStatusSubject as NeuronWalletSubject<boolean>)
  : FallbackSubject

export const SyncedBlockNumber = window.remote
  ? (window.remote.require(`${SUBJECT_PATH}/node`).SyncedBlockNumberSubject as NeuronWalletSubject<string>)
  : FallbackSubject

export const Command = window.remote
  ? (window.remote.require(`${SUBJECT_PATH}/command`).default as NeuronWalletSubject<{
      winID: number
      type: 'nav' | 'toggleAddressBook'
      payload: string | null
    }>)
  : FallbackSubject

export default {
  SystemScript,
  DataUpdate,
  NetworkList,
  CurrentNetworkID,
  ConnectionStatus,
  SyncedBlockNumber,
  Command,
}
