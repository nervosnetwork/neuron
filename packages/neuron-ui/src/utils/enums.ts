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
  SUDTAccountList = '/s-udt/accounts',
  SUDTSend = '/s-udt/send',
  SUDTReceive = '/s-udt/receive',
  ImportHardware = '/*/import-hardware',
  OfflineSign = '/*/offline-sign',
}

export enum CapacityUnit {
  CKB = 'ckb',
  CKKB = 'ckkb',
  CKGB = 'ckgb',
}

export enum Price {
  High = '5000',
  Medium = '2000',
  Low = '1000',
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
  CapacityNotEnough = 109,
  LiveCapacityNotEnough = 110,
  CurrentWalletNotSet = 111,
  WalletNotFound = 112,
  InvalidKeystore = 113,
  CapacityTooSmall = 114,
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
  ValueReserved = 210,
  AmountZero = 211,
  FieldTooSimple = 212,
  FieldIrremovable = 301,
  FieldNotFound = 303,
  CameraUnavailable = 304,
  AddressIsEmpty = 305,
  MainnetAddressRequired = 306,
  TestnetAddressRequired = 307,
  BalanceNotEnough = 308,
  AddressIsDeprecated = 309,
  // hardware
  SignTransactionFailed = 400,
  ConnectFailed = 401,
  CkbAppNotFound = 402,
  DeviceNotFound = 403,
  MultiDevice = 404,
  UnknownError = 405,
  SignMessageFailed = 406,
  UnsupportedManufacturer = 407,
  // offline
  DeviceInSleep = 501,
}

export enum SyncStatus {
  SyncNotStart,
  SyncPending,
  Syncing,
  SyncCompleted,
}

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

// FIXME: supported locks should be returned from neuron-wallet
export enum DefaultLockInfo {
  CodeHash = '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  HashType = 'type',
  CodeHashIndex = '0x00',
  ArgsLen = '20',
}

export enum MultiSigLockInfo {
  CodeHash = '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
  HashType = 'type',
  CodeHashIndex = '0x01',
  ArgsLen = '20',
}

export enum AnyoneCanPayLockInfoOnAggron {
  CodeHash = '0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356',
  HashType = 'type',
  CodeHashIndex = '0x02',
  ArgsLen = '20,21,22',
}

export enum AnyoneCanPayLockInfoOnLina {
  CodeHash = '0xd369597ff47f29fbc0d47d2e3775370d1250b85140c670e4718af712983a2354',
  HashType = 'type',
  CodeHashIndex = '0x02',
  ArgsLen = '20,21,22',
}

export enum DeprecatedScript {
  AcpOnLina = '0x020fb343953ee78c9986b091defb6252154e0bb51044fd2879fde5b27314506111',
  AcpOnAggron = '0x0486a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b',
}

export enum AccountType {
  CKB,
  SUDT,
}
