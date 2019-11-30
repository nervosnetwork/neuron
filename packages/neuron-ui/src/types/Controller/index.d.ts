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
}
