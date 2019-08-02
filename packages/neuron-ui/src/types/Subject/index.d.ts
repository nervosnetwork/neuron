interface Subscription {
  unsubscribe: () => void
}
interface NeuronWalletSubject<T = any> {
  subscribe: (onData?: (data: T) => void, onError?: (error: Error) => void, onComplete?: () => void) => Subscription
  unsubscribe: () => void
}

declare namespace Command {
  type Type = 'nav' | 'toggle-address-book' | 'delete-wallet' | 'backup-wallet'
  type Payload = string | null
}

declare namespace Subject {
  interface SystemScript {
    codeHash: string
  }
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
  type ConnectionStatus = boolean
  type BlockNumber = string
}
