export const MAX_NETWORK_NAME_LENGTH = 28
export const ADDRESS_LENGTH = 46
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 50
export const MIN_AMOUNT = 61
export const PAGE_SIZE = 15
export const UNREMOVABLE_NETWORK = 'Testnet'
export const UNREMOVABLE_NETWORK_ID = '0'
export const CONFIRMATION_THRESHOLD = 10

export enum ConnectionStatus {
  Online = 'online',
  Offline = 'offline',
}

export enum Routes {
  Launch = '/',
  Overview = '/overview',
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
  ImportKeystore = '/keystore/import',
  NetworkEditor = '/network',
  WalletEditor = '/editwallet',
  Prompt = '/prompt',
}

export enum CapacityUnit {
  CKB = 'ckb',
  CKKB = 'ckkb',
  CKGB = 'ckgb',
}

export const PlaceHolders = {
  send: {
    Amount: 'eg: 100',
  },
}

export enum Message {
  NameRequired = 'messages.name-required',
  URLRequired = 'messages.url-required',
  LengthOfNameShouldBeLessThanOrEqualTo = 'messages.length-of-name-should-be-less-than-or-equal-to',
  NetworkNameUsed = 'messages.network-name-used',
  AtLeastOneAddressNeeded = 'messages.at-least-one-address-needed',
  InvalidAddress = 'messages.invalid-address',
  InvalidAmount = 'messages.invalid-amount',
  AmountNotEnough = 'messages.amount-not-enough',
  IsUnremovable = 'messages.is-unremovable',
  ProtocolRequired = 'messages.protocol-required',
  AmountTooSmall = 'messages.amount-too-small',
}

export enum MnemonicAction {
  Create = 'create',
  Verify = 'verify',
  Import = 'import',
}

export const FULL_SCREENS = [
  `${Routes.Transaction}/`,
  `/wizard/`,
  `/keystore/`,
  `${Routes.Settings}/`,
  `${Routes.WalletEditor}/`,
  `${Routes.NetworkEditor}/`,
]
