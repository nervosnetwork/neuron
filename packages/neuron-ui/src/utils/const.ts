export const MAX_NETWORK_NAME_LENGTH = 28
export const ADDRESS_LENGTH = 50
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 50
export const PAGE_SIZE = 15
export const UNREMOVABLE_NETWORK = 'Testnet'
export const UNREMOVABLE_NETWORK_ID = '0'

export enum ConnectStatus {
  Online = 'online',
  Offline = 'offline',
}
export enum NetworkType {
  Default,
  Normal,
}

export enum Channel {
  Initiate = 'initiate',
  NavTo = 'navTo',
  Terminal = 'terminal',
  App = 'app',
  Networks = 'networks',
  Transactions = 'transactions',
  Wallets = 'wallets',
  Helpers = 'helpers',
}

export enum Routes {
  Launch = '/',
  WalletWizard = '/wizard',
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
  ProtocolIsRequired = 'protocol-is-required',
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
