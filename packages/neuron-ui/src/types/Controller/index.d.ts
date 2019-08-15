declare namespace Controller {
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
  interface SendTransaction {
    id: string
    walletID: string
    items: {
      address: string
      capacity: string
    }[]
    password: string
    fee: string
    description: string
  }

  interface CalculateCycles {
    walletID: string
    items: {
      address: string
      capacity: string
    }
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
}
