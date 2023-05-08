interface Subscription {
  unsubscribe: () => void
}
interface NeuronWalletSubject<T = any> {
  subscribe: (onData?: (data: T) => void, onError?: (error: Error) => void, onComplete?: () => void) => Subscription
  unsubscribe: () => void
}

declare namespace Command {
  type Type =
    | 'navigate-to-url'
    | 'delete-wallet'
    | 'backup-wallet'
    | 'import-hardware'
    | 'load-transaction-json'
    | 'migrate-acp'
    | 'sign-verify'
  type Payload = string | null
}

declare namespace Subject {
  interface DataUpdateMetaInfo {
    walletID?: string
    dataType: 'address' | 'transaction' | 'current-wallet' | 'wallets' | 'network'
    actionType: 'create' | 'update' | 'delete'
  }
  type NetworkList = State.Network[]
  type CurrentNetworkID = string
  interface CommandMetaInfo {
    winID: number
    type: Command.Type
    payload: Command.Payload
  }
  interface ConnectionStatus extends Record<'connected' | 'isBundledNode' | 'startedBundledNode', boolean> {
    url: string
  }
  type BlockNumber = string
  interface SyncState {
    cacheTipNumber: number
    bestKnownBlockNumber: number
    bestKnownBlockTimestamp: number
    estimate: number
    status: number
    isLookingValidTarget: boolean
    validTarget?: string
  }

  interface AppUpdater {
    checking: boolean
    downloadProgress: number
    version: string
    releaseNotes: string
  }
  type URL = string
  type SignIndex = number
}
