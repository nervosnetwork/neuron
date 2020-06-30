declare namespace State {
  interface Transaction {
    readonly type: 'send' | 'receive'
    readonly createdAt: string
    readonly updatedAt: string
    readonly timestamp: string
    readonly value: string
    readonly hash: string
    readonly description: string
    readonly blockNumber: string
    readonly status: 'pending' | 'success' | 'failed'
    readonly nervosDao: boolean
    readonly sudtInfo?: Readonly<{
      sUDT: {
        tokenID: string
        tokenName: string
        symbol: string
        decimal: string
      }
      amount: string
    }>
  }

  interface DetailedInput {
    readonly capacity: string | null
    readonly lockHash: string | null
    readonly previousOutput: {
      readonly blockHash: string | null
      readonly cell: Readonly<{
        txHash: string
        index: string
      } | null>
    }
    readonly lock: Readonly<CKBComponents.Script | null>
  }

  interface DetailedOutput {
    readonly capacity: string
    readonly lock: Readonly<CKBComponents.Script>
    readonly lockHash: string
    readonly outPoint: Readonly<{
      index: string
      txHash: string
    }>
  }
  interface DetailedTransaction extends Transaction {
    readonly blockHash: string
    readonly blockNumber: string
    readonly deps: any[]
    readonly inputs: Readonly<DetailedInput[]>
    readonly inputsCount: string
    readonly outputs: Readonly<DetailedOutput[]>
    readonly outputsCount: string
    readonly witnesses: string[]
  }
  interface Output {
    readonly address: string | undefined
    readonly amount: string | undefined
    readonly unit: any
    readonly date?: string
  }
  type MessageType = 'success' | 'warning' | 'alert'
  interface Message<Code = number, Meta = Readonly<{ [key: string]: string | undefined }>> {
    readonly type: MessageType
    readonly timestamp: number
    readonly code?: Code
    readonly content?: string
    readonly meta?: Meta
  }
  interface Send {
    readonly txID: string
    readonly outputs: Readonly<Output[]>
    readonly price: string
    readonly description: string
    readonly generatedTx: any
  }

  interface Popup {
    readonly timestamp: number
    readonly text: string
  }

  interface PasswordRequest {
    readonly actionType: 'send' | 'backup' | 'delete' | 'unlock' | 'create-sudt-account' | 'send-sudt' | null
    readonly walletID: string
  }

  type AlertDialog = Readonly<{ title: string; message: string }> | null
  type GlobalDialogType = 'unlock-success' | 'rebuild-sync' | null

  interface App {
    readonly tipBlockNumber: string
    readonly tipBlockHash: string
    readonly tipBlockTimestamp: number
    readonly chain: string
    readonly difficulty: bigint
    readonly epoch: string
    readonly send: Readonly<Send>
    readonly passwordRequest: PasswordRequest
    // TODO: is the field used in the app?
    readonly messages: {
      readonly [index: string]: Message | null
    }
    readonly popups: Readonly<Popup[]>
    readonly notifications: Readonly<Message[]>
    readonly globalDialog: GlobalDialogType
    readonly alertDialog: AlertDialog
    readonly loadings: Readonly<{
      sending: boolean
      addressList: boolean
      transactionList: boolean
    }>
    readonly showTopAlert: boolean
    readonly showAllNotifications: boolean
    readonly isAllowedToFetchList: boolean
  }

  interface NetworkProperty {
    readonly name: string
    readonly remote: string
    readonly chain: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string
    readonly type: 0 | 1
  }

  interface Network extends NetworkProperty {
    readonly id: NetworkID
  }

  interface WalletIdentity {
    readonly id: string
    readonly name: string
  }

  interface Address {
    readonly address: string
    readonly identifier: string
    readonly description: string
    readonly type: 0 | 1 // 0 for receiving, 1 for change
    readonly txCount: number
    readonly balance: string
    readonly index: number
  }

  interface Wallet extends WalletIdentity {
    readonly balance: string
    readonly addresses: Readonly<Address[]>
  }
  type ConnectionStatus = 'online' | 'offline' | 'connecting'

  interface Chain {
    readonly networkID: string
    readonly connectionStatus: ConnectionStatus
    readonly tipBlockNumber: string
    readonly transactions: Readonly<{
      pageNo: number
      pageSize: number
      totalCount: number
      items: Readonly<Transaction[]>
      keywords: string
    }>
  }
  interface Settings {
    readonly general: {}
    readonly networks: Readonly<Network[]>
    readonly wallets: Readonly<WalletIdentity[]>
  }

  interface NervosDAORecord {
    readonly blockNumber: string // '0', the block of current status. Namely it's the deposit block number if the depositOutPoint is undefined, or the withdrawn block number if the depositOutPoint
    readonly blockHash: string
    readonly capacity: string
    readonly lock: Readonly<{
      codeHash: string
      hashType: 'type' | 'data'
      args: string
    }>
    readonly type: Readonly<{
      codeHash: string
      hashType: 'type' | 'data'
      args: string
    }>
    readonly lockHash: string
    readonly typeHash: string | null
    readonly outPoint: Readonly<{
      txHash: string
      index: string // '0'
    }>
    readonly status: 'live' | 'dead' | 'sent' | 'pending' | 'failed' // 1. status === deat => record is completed; 2. status === sent => depositing or withdrawing; 3. status === live => record is deposited or locked; 4. status === pending => unlocking
    readonly daoData: string // locktime epoch in le
    readonly data: string
    readonly timestamp: string
    readonly depositOutPoint?: Readonly<{
      txHash: string
      index: string
    }>
    readonly depositTimestamp?: string
    readonly multiSignBlake160: string | null
    readonly depositInfo?: {
      txHash: string
      timestamp: string
    }
    readonly withdrawInfo?: {
      txHash: string
      timestamp: string
    }
    readonly unlockInfo?: {
      txHash: string
      timestamp: string
    }
  }

  interface NervosDAO {
    readonly records: Readonly<NervosDAORecord[]>
  }

  interface AppUpdater {
    readonly checking: boolean
    readonly downloadProgress: number
    readonly version: string
    readonly releaseNotes: string
  }

  interface AppWithNeuronWallet {
    readonly app: App
    readonly chain: Chain
    readonly settings: Settings
    readonly wallet: Wallet
    readonly nervosDAO: NervosDAO
    readonly updater: AppUpdater
    readonly experimental: { tx: any; assetAccount?: any } | null
  }
}

declare namespace CustomRouter {
  interface Route {
    name: string
    path: string
    params?: string
    exact?: boolean
    component: React.FunctionComponent<any>
  }
}
