export const MAX_NETWORK_NAME_LENGTH = 28
export const ADDRESS_LENGTH = 46
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 50
export const MIN_AMOUNT = 61
export const PAGE_SIZE = 15
export const UNREMOVABLE_NETWORK = 'Testnet'
export const UNREMOVABLE_NETWORK_ID = '0'
export const CONFIRMATION_THRESHOLD = 10

export const MAX_DECIMAL_DIGITS = 8

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
  DecimalExceed = 'messages.amount-decimal-exceed',
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

export enum ErrorCode {
  // Errors from RPC
  ErrorFromRPC = -3,
  // Errors from neuron-wallet
  CapacityNotEnough = 100,
  CapacityTooSmall = 101,
  FieldIsInvalid = 102,
  // Parameter validation errors from neuron-ui
  FieldRequired = 201,
  FieldUsed = 202,
  FieldTooLong = 203,
  FieldTooShort = 204,
  FieldInvalid = 205,
  // Other errors
  FieldIrremovable = 301,
  FailToLaunch = 302,
  FieldNotFound = 303,
  CameraUnavailable = 304,
}
