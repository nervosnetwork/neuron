export const MAX_NETWORK_NAME_LENGTH = 28
export const MAX_WALLET_NAME_LENGTH = 20
export const ADDRESS_LENGTH = 46
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 50
export const MIN_AMOUNT = 61
export const SINCE_FIELD_SIZE = 8
export const PAGE_SIZE = 15
export const UNREMOVABLE_NETWORK = 'Testnet'
export const UNREMOVABLE_NETWORK_ID = '0'
export const CONFIRMATION_THRESHOLD = 300
export const MAX_TIP_BLOCK_DELAY = 180000
export const BUFFER_BLOCK_NUMBER = 10

export const MAX_DECIMAL_DIGITS = 8
export const MAINNET_TAG = 'ckb'

export const MIN_DEPOSIT_AMOUNT = 102

export const SHANNON_CKB_RATIO = 1e8

export const MEDIUM_FEE_RATE = 6000
export const WITHDRAW_EPOCHS = 180
export const IMMATURE_EPOCHS = 4
export const MILLISECONDS_IN_YEAR = 365 * 24 * 3600 * 1000
export const HOURS_PER_EPOCH = 4
export const HOURS_PER_DAY = 24

export const INIT_SEND_PRICE = '1000'

export const NERVOS_DAO_RFC_URL =
  'https://www.github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md'

export enum ConnectionStatus {
  Online = 'online',
  Offline = 'offline',
  Connecting = 'connecting',
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
  NervosDAO = '/nervos-dao',
  SpecialAssets = '/special-assets',
}

export enum CapacityUnit {
  CKB = 'ckb',
  CKKB = 'ckkb',
  CKGB = 'ckgb',
}

export enum Price {
  Immediately = '18000',
  TenBlocks = '6000',
  HundredBlocks = '3000',
  FiveHundredsBlocks = '0',
}

export const PlaceHolders = {
  send: {
    Calculating: '······',
    Amount: 'eg: 100',
  },
}

export enum MnemonicAction {
  Create = 'create',
  Verify = 'verify',
  Import = 'import',
}

export const FULL_SCREENS = [`${Routes.Transaction}/`, `/wizard/`, `/keystore/`]

export enum ErrorCode {
  // Errors from RPC
  ErrorFromRPC = -3,
  // Errors from neuron-wallet
  AmountNotEnough = 100,
  AmountTooSmall = 101,
  PasswordIncorrect = 103,
  NodeDisconnected = 104,
  CapacityNotEnoughForChange = 105,
  LocktimeAmountTooSmall = 107,
  AddressNotFound = 108,
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
  FieldNotFound = 303,
  CameraUnavailable = 304,
  AddressIsEmpty = 305,
  MainnetAddressRequired = 306,
  TestnetAddressRequired = 307,
}

export enum SyncStatus {
  SyncNotStart,
  SyncPending,
  Syncing,
  SyncCompleted,
}

export const SyncStatusThatBalanceUpdating = [SyncStatus.Syncing, SyncStatus.SyncPending]

export enum PRESET_SCRIPT {
  Locktime = 'SingleMultiSign',
}

export enum CompensationPeriod {
  SUGGEST_START = 0.767,
  REQUEST_START = 0.967,
  REQUEST_END = 1,
}

export enum ResponseCode {
  FAILURE,
  SUCCESS,
}
