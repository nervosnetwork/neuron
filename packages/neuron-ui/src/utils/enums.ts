export enum ConnectionStatus {
  Online = 'online',
  Offline = 'offline',
  Connecting = 'connecting',
}

export enum RoutePath {
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

export enum PresetScript {
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
