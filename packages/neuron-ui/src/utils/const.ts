export const MAX_NETWORK_NAME_LENGTH = 28
export const MAX_WALLET_NAME_LENGTH = 20
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
  AmountNotEnough = 100,
  AmountTooSmall = 101,
  PasswordIncorrect = 103,
  NodeDisconnected = 104,
  // Parameter validation errors from neuron-ui
  FieldRequired = 201,
  FieldUsed = 202,
  FieldTooLong = 203,
  FieldTooShort = 204,
  FieldInvalid = 205,
  DecimalExceed = 206,
  NotNegative = 207,
  ProtocolRequired = 208,
  NoWhiteSpaces = 209,
  FieldIrremovable = 301,
  FailToLaunch = 302,
  FieldNotFound = 303,
  CameraUnavailable = 304,
  AddressIsEmpty = 305,
}
