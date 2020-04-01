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
    readonly actionType: 'send' | 'backup' | 'delete' | 'unlock' | null
    readonly walletID: string
    readonly password: string
  }

  type AlertDialog = Readonly<{ title: string; message: string }> | null

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
    readonly globalDialog: 'unlock-success' | null
    readonly alertDialog: AlertDialog
    readonly loadings: Readonly<{
      sending: boolean
      addressList: boolean
      transactionList: boolean
      network: boolean
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
    readonly blockNumber: string
    readonly blockHash: string
    readonly capacity: string
    readonly lock: Readonly<{
      codeHash: string
      hashType: string
      args: string
    }>
    readonly lockHash: string
    readonly outPoint: Readonly<{
      txHash: string
      index: string
    }>
    readonly depositOutPoint?: Readonly<{
      txHash: string
      index: string
    }>
    readonly status: 'live' | 'dead'
    readonly type: Readonly<{
      codeHash: string
      hashType: string
      args: string
    }>
    readonly typeHash: string | null
    readonly daoData: string
    readonly timestamp: string
    readonly depositTimestamp?: string
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
