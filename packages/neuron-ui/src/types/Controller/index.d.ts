declare namespace Controller {
  interface OpenInWindowParams {
    url: string
    title: string
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
  }

  interface RequestPasswordParams {
    walletID: string
    action: 'delete-wallet' | 'backup-wallet'
  }

  interface DeleteWalletParams {
    id: string
    password: string
  }

  interface BackupWalletParams {
    id: string
    password: string
  }

  type SetCurrentWalletParams = string

  interface SendTransactionParams {
    walletID: string
    tx: string
    password: string
    description?: string
  }

  interface GenerateTransactionParams {
    walletID: string
    items: {
      address: string
      capacity: string
    }[]
    feeRate: string
  }

  type GenerateSendingAllTransactionParams = GenerateTransactionParams

  interface GenerateDepositAllTransactionParams {
    walletID: string
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

  interface CreateNetworkParams {
    name: string
    remote: string
  }

  interface UpdateNetworkParams {
    networkID: string
    options: Partial<{ name: string; remote: string }>
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
    address: string
    password: string
    message: string
  }

  interface VerifyMessageParams {
    address: string
    signature: string
    message: string
  }
  // Special Assets
  interface GetSpeicalAssetsParams {
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
    public id?: number
    public walletID: string
    public tokenID: string
    public symbol: string
    public accountName: string
    public tokenName: string
    public decimal: string
    public balance: string
    public blake160: string
    public address: string
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
    }
    interface Response {
      assetAccount: any
      tx: any
    }
  }

  namespace SendCreateSUDTAccountTransaction {
    interface Params {
      walletID: string
      assetAccount: Pick<SUDTAccount, 'symbol' | 'tokenName' | 'accountName' | 'decimal' | 'tokenID'>
      tx: any
      password: string
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

  namespace GenerateSendAllSUDTTransaction {
    type SerializedTx = string
    interface Params {
      assetAccountID: string
      walletID: string
      address: string
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
      password: string
    }
    type Response = Hash
  }
}
