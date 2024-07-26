declare namespace Controller {
  enum UDTType {
    SUDT = 'sUDT',
    XUDT = 'xUDT',
  }

  interface RequestOpenInExplorerParams {
    key: string
    type: 'transaction'
  }

  interface OpenInWindowParams {
    url: string
    title: string
  }

  interface ShowSettingsParams {
    tab: 'general' | 'wallets' | 'networks'
  }

  interface CreateWalletParams {
    name: string
    mnemonic: string
    password: string
  }
  interface ImportMnemonicParams {
    name: string
    mnemonic: string
    password: string
  }

  interface ImportKeystoreParams {
    name: string
    keystorePath: string
    password: string
  }
  interface UpdateWalletParams {
    id: string
    password?: string
    newPassword?: string
    name?: string
    device?: any
  }

  interface UpdateWalletStartBlockNumberParams {
    id: string
    startBlockNumber: string
  }

  interface RequestPasswordParams {
    walletID: string
    action: 'delete-wallet' | 'backup-wallet'
  }

  interface DeleteWalletParams {
    id: string
    password: string
  }

  interface ReplaceWalletParams {
    existingWalletId: string
    importedWalletId: string
  }

  interface BackupWalletParams {
    id: string
    password: string
  }

  type SetCurrentWalletParams = string

  interface SendTransactionParams {
    walletID: string
    tx: any
    password?: string
    description?: string
    amendHash?: string
    skipLastInputs?: boolean
    multisigConfig?: {
      id: number
      walletId: string
      r: number
      m: number
      n: number
      blake160s: string[]
      alias?: string
    }
  }

  interface GenerateTransactionParams {
    walletID: string
    items: {
      address: string
      capacity: string
    }[]
    feeRate: string
    consumeOutPoints?: CKBComponents.OutPoint[]
    enableUseSentCell?: boolean
  }

  type GenerateSendingAllTransactionParams = GenerateTransactionParams

  interface GenerateDepositAllTransactionParams {
    walletID: string
    isBalanceReserved: boolean
    feeRate: string
  }

  interface ComputeCycles {
    walletID: string
    capacities: string
  }

  type GetAddressesByWalletIDParams = string
  interface UpdateAddressDescriptionParams {
    walletID: string
    address: string
    description: string
  }

  enum NetworkType {
    Default, // internal full node
    Normal,
    Light, // internal Light node
  }

  interface CreateNetworkParams {
    name: string
    remote: string
    type: NetworkType
  }

  interface UpdateNetworkParams {
    networkID: string
    options: Partial<{ name: string; remote: string; type: NetworkType }>
  }

  interface UpdateTransactionDescriptionParams {
    walletID: string
    hash: string
    description: string
  }
  type SetSkipAndTypeParam = boolean

  type GetNervosDaoDataParams = {
    walletID: string
  }

  // the generate deposit tx method in neuron wallet
  interface DepositParams {
    walletID: string
    capacity: string
    feeRate: string
  }

  // the start withdraw from dao method in neuron wallet
  interface WithdrawParams {
    walletID: string
    outPoint: {
      txHash: string
      index: string
    }
    feeRate: string
  }

  // the withdraw from dao method in neuron wallet
  interface ClaimParams {
    walletID: string
    depositOutPoint: {
      txHash: string
      index: string
    }
    withdrawingOutPoint: {
      txHash: string
      index: string
    }
    feeRate: string
  }

  interface SignMessageParams {
    walletID: string
    address?: string
    password: string
    message: string
  }

  interface VerifyMessageParams {
    address: string
    signature: string
    message: string
  }
  // Special Assets
  interface GetSpecialAssetsParams {
    walletID: string
    pageNo: number
    pageSize: number
  }
  interface UnlockSpecialAssetParams {
    walletID: string
    outPoint: {
      txHash: string
      index: string
    }
    feeRate: string
    customizedAssetInfo: {
      lock: string
      type: string
      data: string
    }
  }
  /**
   * sUDT related API
   */
  namespace GetScript {
    interface Response {
      cellDep: any
      codeHash: string
      hashType: 'data' | 'type'
    }
  }
  interface SUDTAccount {
    id?: number
    walletID: string
    tokenID: string
    symbol: string
    accountName: string
    tokenName: string
    decimal: string
    balance: string
    blake160: string
    address: string
    udtType?: UDTType
  }

  namespace GetSUDTAccount {
    interface Params {
      walletID: string
      id: string
    }
    type Response = SUDTAccount
  }

  namespace GetSUDTAccountList {
    interface Params {
      walletID: string
    }

    type Response = SUDTAccount[]
  }

  namespace GenerateCreateSUDTAccountTransaction {
    interface Params {
      walletID: string
      tokenID: string
      tokenName: string
      accountName: string
      symbol: string
      decimal: string
      feeRate: string
      udtType?: UDTType
    }
    interface Response {
      assetAccount: any
      tx: any
    }
  }

  namespace SendCreateSUDTAccountTransaction {
    interface Params {
      walletID: string
      assetAccount: Pick<SUDTAccount, 'symbol' | 'tokenName' | 'accountName' | 'decimal' | 'tokenID' | 'udtType'>
      tx: any
      password?: string
    }
  }

  namespace UpdateSUDTAccount {
    interface Params {
      id: number
      tokenName?: string
      accountName?: string
      symbol?: string
      decimal?: string
    }
  }

  namespace GenerateSUDTTransaction {
    type SerializedTx = any
    interface Params {
      assetAccountID: string
      walletID: string
      address: string
      amount: string
      feeRate: string
      description?: string
    }

    type Response = SerializedTx
  }

  namespace SendSUDTTransaction {
    type Hash = string
    interface Params {
      walletID: string
      tx: any
      password?: string
      skipLastInputs?: boolean
      amendHash?: string
    }
    type Response = Hash
  }

  namespace CheckMigrateAcp {
    type Params = void
    type Response = boolean | undefined
  }

  namespace MigrateAcp {
    interface Params {
      id: string
      password?: string
    }
  }

  namespace ExportTransactions {
    interface Params {
      walletID: string
    }
  }

  namespace GetTokenInfoList {
    interface TokenInfo {
      tokenID: string
      symbol: string
      tokenName: string
      decimal: string
    }
    type Response = TokenInfo[]
  }
  namespace GetSUDTTokenInfo {
    interface Params {
      tokenID: string
    }
    interface Response {
      tokenID: string
      symbol: string
      tokenName: string
      decimal: string
    }
  }

  namespace CreateChequeTransaction {
    type Tx = any
    interface Params {
      walletID: string
      assetAccountID: string
      address: string
      amount: string
      feeRate: string
    }

    type Response = Tx
  }

  namespace CreateNFTSendTransaction {
    type Tx = any
    interface Params {
      walletID: string
      outPoint: any
      receiveAddress: string
      description?: string
      feeRate: string
    }

    type Response = Tx
  }

  namespace GenerateWithdrawChequeTransaction {
    type Tx = any
    interface Params {
      walletID: string
      chequeCellOutPoint: OutPoint
    }

    interface Response {
      tx: Tx
    }
  }

  namespace SendWithdrawChequeTransaction {
    type Tx = any
    interface Params {
      walletID: string
      tx: Tx
      password: string
    }

    type Response = string
  }

  namespace GenerateClaimChequeTransaction {
    type AssetAccount = Pick<
      SUDTAccount,
      'accountName' | 'balance' | 'blake160' | 'decimal' | 'symbol' | 'tokenID' | 'tokenName' | 'udtType'
    >

    interface Params {
      walletID: string
      chequeCellOutPoint: CKBComponents.OutPoint
    }

    interface Response {
      tx: any
      assetAccount?: AssetAccount
    }
  }
}
