declare namespace State {
  interface Transaction {
    type: 'send' | 'receive' | 'create' | 'destroy'
    createdAt: string
    updatedAt: string
    timestamp: string
    value: string
    hash: string
    description: string
    blockNumber: string
    status: 'pending' | 'success' | 'failed'
    nervosDao: boolean
    sudtInfo?: {
      sUDT: Record<'tokenID' | 'tokenName' | 'symbol' | 'decimal', string>
      amount: string
    }
    nftInfo?: {
      type: 'send' | 'receive'
      data: string
    }
    assetAccountType?: 'CKB' | 'sUDT' | string
  }

  interface DetailedInput {
    capacity: string | null
    lockHash: string | null
    previousOutput: {
      blockHash: string | null
      cell: Record<'txHash' | 'index', string> | null
    }
    lock: CKBComponents.Script | null
  }

  interface DetailedOutput {
    capacity: string
    lock: CKBComponents.Script
    lockHash: string
    outPoint: CKBComponents.OutPoint
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
    address: string | undefined
    amount: string | undefined
    unit: any
    date?: string
  }
  type MessageType = 'success' | 'warning' | 'alert'
  interface Message<Code = number, Meta = Partial<Record<string, string>>> {
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
    generatedTx: any
  }

  interface Popup {
    timestamp: number
    text: string
  }

  interface PasswordRequest {
    readonly actionType:
      | 'send'
      | 'backup'
      | 'delete'
      | 'unlock'
      | 'create-sudt-account'
      | 'send-ckb-asset'
      | 'send-sudt'
      | 'send-acp-sudt-to-new-cell'
      | 'send-acp-ckb-to-new-cell'
      | 'send-cheque'
      | 'withdraw-cheque'
      | 'claim-cheque'
      | 'create-account-to-claim-cheque'
      | 'destroy-asset-account'
      | 'migrate-acp'
      | 'send-nft'
      | 'send-from-multisig'
      | 'send-from-multisig-need-one'
      | null
    walletID: string
    multisigConfig?: {
      id: number
      walletId: string
      r: number
      m: number
      n: number
      blake160s: string[]
    }
  }

  interface SUDTAccount {
    accountId: string
    accountName?: string
    tokenName?: string
    symbol?: string
    balance: string
    tokenId: string
    address: string
    decimal: string
  }

  type AlertDialog = {
    show?: boolean
    title?: string
    message?: string
    type: 'success' | 'failed' | 'warning'
    onClose?: () => void
    onOk?: () => void
    onCancel?: () => void
  } | null
  type GlobalDialogType = 'unlock-success' | 'rebuild-sync' | null
  type PageNotice = { i18nKey: string; status: 'success' | 'error' | 'warn' }

  type FeeRateStatsType = { mean: string | number; median: string | number; suggestFeeRate: string | number }

  interface App {
    tipBlockNumber: string
    tipDao?: string
    tipBlockTimestamp: number
    epoch: string
    send: Send
    passwordRequest: PasswordRequest
    // TODO: is the field used in the app?
    messages: Record<string, Message | null>
    popups: Popup[]
    notifications: Message[]
    globalDialog: GlobalDialogType
    alertDialog: AlertDialog
    loadings: Record<'sending' | 'addressList' | 'transactionList', boolean>
    showTopAlert: boolean
    showAllNotifications: boolean
    isAllowedToFetchList: boolean
    loadedTransaction: any
    pageNotice?: PageNotice
    showWaitForFullySynced: boolean
  }

  interface NetworkProperty {
    name: string
    remote: string
    chain: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string
    type: 0 | 1 | 2
    genesisHash: string
  }

  interface Network extends NetworkProperty {
    id: NetworkID
  }

  enum Manufacturer {
    Ledger = 'Ledger',
  }

  interface DeviceInfo {
    descriptor: string
    vendorId: string
    manufacturer: Manufacturer
    product: string
  }

  interface WalletIdentity {
    id: string
    name: string
    device?: DeviceInfo
    isHD?: boolean
    isWatchOnly?: boolean
  }

  interface DeviceInfo {
    descriptor: string
    vendorId: string
    manufacturer: string
    product: string
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
  type ConnectionStatus = 'online' | 'offline' | 'connecting'

  type SyncState = Readonly<{
    cacheTipBlockNumber: number
    bestKnownBlockNumber: number
    bestKnownBlockTimestamp: number
    estimate: number | undefined
    status: number
    isLookingValidTarget: boolean
    validTarget?: string
    syncStatus?: SyncStatus
  }>

  interface Chain {
    networkID: string
    connectionStatus: ConnectionStatus
    syncState: SyncState
    transactions: {
      pageNo: number
      pageSize: number
      totalCount: number
      items: Transaction[]
      keywords: string
    }
  }
  interface Settings {
    general: object
    networks: Network[]
    wallets: WalletIdentity[]
  }

  type DaoActionInfo = Record<'txHash' | 'timestamp', string>

  interface NervosDAORecord {
    blockNumber: string // '0', the block of current status. Namely it's the deposit block number if the depositOutPoint is undefined, or the withdrawn block number if the depositOutPoint
    blockHash: string
    capacity: string
    lock: CKBComponents.Script
    type: CKBComponents.Script
    lockHash: string
    typeHash: string | null
    outPoint: CKBComponents.OutPoint
    status: 'live' | 'dead' | 'sent' | 'pending' | 'failed' // 1. status === deat => record is completed; 2. status === sent => depositing or withdrawing; 3. status === live => record is deposited or locked; 4. status === pending => unlocking
    daoData: string // locktime epoch in le
    data: string
    timestamp: string
    depositOutPoint?: CKBComponents.OutPoint
    depositTimestamp?: string
    multiSignBlake160: string | null
    depositInfo?: DaoActionInfo
    withdrawInfo?: DaoActionInfo
    unlockInfo?: DaoActionInfo
  }

  interface NervosDAO {
    records: NervosDAORecord[]
  }

  interface AppUpdater {
    checking: boolean
    downloadProgress: number
    version: string
    releaseNotes: string
  }

  interface AppWithNeuronWallet {
    app: App
    chain: Chain
    settings: Settings
    wallet: Wallet
    nervosDAO: NervosDAO
    updater: AppUpdater
    sUDTAccounts: SUDTAccount[]
    experimental: { tx: any; assetAccount?: any } | null
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
