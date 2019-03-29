export const MAX_NETWORK_NAME_LENGTH = 28
export const ADDRESS_LENGTH = 40
export const PAGE_SIZE = 15
export const UnremovableNetwork = 'Testnet'
export const UnremovableNetworkId = '0'

export enum NetworkStatus {
  Online = 'online',
  Offline = 'offline',
}

export enum Channel {
  SetLanguage = 'setLanguage',
  CreateWallet = 'createWallet',
  DeleteWallet = 'deleteWallet',
  EditWallet = 'editWallet',
  ImportWallet = 'importWallet',
  ExportWallet = 'exportWallet',
  GetBalance = 'getBalance',
  GetWallet = 'getWallet',
  CheckWalletPassword = 'checkWalletPassword',
  GetWallets = 'getWallets',
  SendCapacity = 'sendCapacity',

  NavTo = 'navTo',
  Terminal = 'terminal',
  Networks = 'networks',
  Transactions = 'transactions',
  Wallets = 'wallets',
  ContextMenu = 'contextMenu',
}

export enum Routes {
  Home = '/',
  Mnemonic = '/mnemonic',
  Wallet = '/wallet',
  Send = '/send',
  Receive = '/receive',
  History = '/history',
  Transaction = '/transaction',
  Addresses = '/addresses',
  Settings = '/settings',
  SettingsGeneral = '/settings/general',
  SettingsWallets = '/settings/wallets',
  SettingsNetworks = '/settings/networks',
  CreateWallet = '/wallets/new',
  ImportWallet = '/wallets/import',
  WalletWizard = '/wallets/wizard',
  WalletSubmission = '/wallets/submission',
  Terminal = '/terminal',
  NetworkEditor = '/network',
  WalletEditor = '/editwallet',
  Prompt = '/prompt',
}

export enum LocalStorage {
  Networks = 'networks',
}

export enum CapacityUnit {
  CKB = 'ckb',
  CKKB = 'ckkb',
  CKGB = 'ckgb',
}

export const PlaceHolders = {
  transfer: {
    Address: 'eg: 0x0da2fe99fe549e082d4ed483c2e968a89ea8d11aabf5d79e5cbf06522de6e674',
    Capacity: 'eg: 100',
  },
}

export const Tooltips = {
  transfer: {
    Address: 'Address to send capacity',
    Capacity: 'Capacity to send',
  },
}

export enum Message {
  NameIsRequired = 'name-is-required',
  URLIsRequired = 'url-is-required',
  LengthOfNameShouldBeLessThanOrEqualTo = 'length-of-name-should-be-less-than-or-equal-to',
  NetworkNameExist = 'network-name-exists',
  AtLeastOneAddressNeeded = 'at-least-one-address-needed',
  InvalidAddress = 'invalid-address',
  InvalidCapacity = 'invalid-capacity',
  CapacityNotEnough = 'capacity-is-not-enough',
  IsUnremovable = 'is-unremovable',
}

export enum TransactionType {
  Sent,
  Received,
  Other,
}

export enum MnemonicAction {
  Create = 'create',
  Verify = 'verify',
  Import = 'import',
}
