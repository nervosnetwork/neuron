declare namespace State {
  interface Transaction {
    type: 'send' | 'receive'
    createdAt: string
    updatedAt: string
    timestamp: string
    value: string
    hash: string
    description: string
    blockNumber: string
    status: 'pending' | 'success' | 'failed'
  }
  interface DetailedTransaction extends Transaction {
    blockHash: string
    blockNumber: string
    deps: any[]
    inputs: {
      capacity: string | null
      lockHash: string | null
      previousOutput: {
        blockHash: string | null
        cell: {
          txHash: string
          index: string
        } | null
      }
    }[]
    outputs: {
      capacity: string
      lock: {
        args: string[]
        codeHash: string
      }
      lockHash: string
      outPoint: {
        blockHash: string | null
        cell: {
          index: string
          txHash: string
        }
      }
    }[]
    witnesses: string[]
  }
  interface Output {
    address: string
    amount: string
    unit: any
  }
  interface Message {
    type: 'success' | 'warning' | 'alert'
    timestamp: number
    content: string
    meta?: { [key: string]: string }
  }
  interface Send {
    txID: string
    outputs: Output[]
    price: string
    cycles: string
    description: string
    loading: boolean
  }

  interface Popup {
    timestamp: Date
    text: string
  }

  interface App {
    tipBlockNumber: string
    chain: string
    difficulty: string
    epoch: string
    send: Send
    passwordRequest: {
      actionType: 'send' | 'backup' | 'delete' | null
      walletID: string
      password: string
    }
    messages: {
      [index: string]: Message | null
    }
    popups: Popup[]
    notifications: Message[]
    loadings: {
      sending: boolean
      addressList: boolean
      transactionList: boolean
      updateDescription: boolean
    }
    showTopAlert: boolean
    showAllNotifications: boolean
  }

  interface NetworkProperty {
    name: string
    remote: string
  }

  interface Network extends NetworkProperty {
    id: NetworkID
  }

  interface WalletIdentity {
    id: string
    name: string
  }

  interface Address {
    address: string
    identifier: string
    description: string
    type: 0 | 1 // 0 for receiving, 1 for change
    txCount: number
    balance: string
    index: number
  }

  interface Wallet extends WalletIdentity {
    balance: string
    addresses: Address[]
  }

  interface Chain {
    networkID: string
    connectionStatus: 'online' | 'offline'
    tipBlockNumber: string
    codeHash: string
    transactions: {
      pageNo: number
      pageSize: number
      totalCount: number
      items: Transaction[]
      keywords: string
    }
  }
  interface Settings {
    showAddressBook: boolean
    networks: Network[]
    wallets: WalletIdentity[]
  }

  interface AppWithNeuronWallet {
    app: App
    chain: Chain
    settings: Settings
    wallet: Wallet
  }
}

declare namespace CustomRouter {
  interface Route {
    name: string
    path: string
    params?: string
    exact?: boolean
    comp: React.FunctionComponent<any>
  }
}
