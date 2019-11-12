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

  interface DetailedInput {
    capacity: string | null
    lockHash: string | null
    previousOutput: {
      blockHash: string | null
      cell: {
        txHash: string
        index: string
      } | null
    }
    lock: CKBComponents.Script | null
  }

  interface DetailedOutput {
    capacity: string
    lock: {
      args: string
      codeHash: string
    }
    lockHash: string
    outPoint: {
      index: string
      txHash: string
    }
  }
  interface DetailedTransaction extends Transaction {
    blockHash: string
    blockNumber: string
    deps: any[]
    inputs: DetailedInput[]
    inputsCount: string
    outputs: DetailedOutput[]
    outputsCount: string
    witnesses: string[]
  }
  interface Output {
    address: string
    amount: string
    unit: any
  }
  type MessageType = 'success' | 'warning' | 'alert'
  interface Message<Code = number, Meta = { [key: string]: string | undefined }> {
    type: MessageType
    timestamp: number
    code?: Code
    content?: string
    meta?: Meta
  }
  interface Send {
    txID: string
    outputs: Output[]
    price: string
    description: string
    generatedTx: any | null
  }

  interface Popup {
    timestamp: Date
    text: string
  }

  interface App {
    tipBlockNumber: string
    tipBlockHash: string
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
      network: boolean
    }
    showTopAlert: boolean
    showAllNotifications: boolean
    isAllowedToFetchList: boolean
  }

  interface NetworkProperty {
    name: string
    remote: string
    chain: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string
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
    general: {}
    networks: Network[]
    wallets: WalletIdentity[]
  }

  interface NervosDAORecord {
    blockNumber: string
    blockHash: string
    capacity: string
    lock: {
      codeHash: string
      hashType: string
      args: string
    }
    lockHash: string
    outPoint: {
      txHash: string
      index: string
    }
    depositOutPoint?: {
      txHash: string
      index: string
    }
    status: 'live' | 'dead'
    type: {
      codeHash: string
      hashType: string
      args: string
    }
    typeHash: string | null
    daoData: string
    timestamp: string
  }

  interface NervosDAO {
    records: NervosDAORecord[]
  }

  interface AppWithNeuronWallet {
    app: App
    chain: Chain
    settings: Settings
    wallet: Wallet
    nervosDAO: NervosDAO
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
