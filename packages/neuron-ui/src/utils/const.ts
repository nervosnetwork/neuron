export enum NetworkStatus {
  Online = 'online',
  Offline = 'offline',
}

export enum Channel {
  // App
  SetLanguage = 'setLanguage',
  // Chain
  GetBlock = 'getBlock',
  GetTransaction = 'getTransaction',
  GetLiveCell = 'getLiveCell',
  GetTipHeader = 'getTipHeader',
  GetTipBlockNumber = 'getTipBlockNumber',
  GetLocalNodeId = 'getLocalNodeId',
  GetNetwork = 'getNetwork',
  SetNetwork = 'setNetwork',
  SwitchNetwork = 'switchNetwork',

  // Wallet
  CreateWallet = 'createWallet',
  DeleteWallet = 'deleteWallet',
  ImportWallet = 'importWallet',
  ExportWallet = 'exportWallet',
  SwitchWallet = 'switchWallet',
  GetBalance = 'getBalance',
  GetCellsByTypeHash = 'getCellsByTypeHash',
  GetUnspentCells = 'getUnspentCells',
  GetTransactions = 'getTransactions',
  GetWallet = 'getWallet',
  GetWallets = 'getWallets',
  SendCapacity = 'sendCapacity',
  SendTransaction = 'sendTransaction',
  Sign = 'sign',

  // Page
  NavTo = 'navTo',
  // Terminal
  Terminal = 'terminal',
}

export enum Routes {
  Home = '/',
  Wallet = '/wallet',
  Send = '/send',
  Receive = '/receive',
  History = '/history',
  Addresses = '/addresses',
  Settings = '/settings',
  SettingsGeneral = '/settings/general',
  SettingsWallets = '/settings/wallets',
  SettingsNetworks = '/settings/networks',
  CreateWallet = '/wallets/new',
  ImportWallet = '/wallets/import',
  WalletWizard = '/wallets/wizard',
  Terminal = '/terminal',
  NetworkEditor = '/network',
  WalletEditor = '/editwallet',
}

export enum LocalStorage {
  Networks = 'networks',
}
