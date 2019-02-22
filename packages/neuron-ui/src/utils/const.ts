export enum NetworkStatus {
  Online = 'online',
  Offline = 'offline',
}

export enum Channel {
  SendCapacity = 'sendCapacity',
  GetCellsByTypeHash = 'getCellsByTypeHash',
}

export enum Routes {
  Home = '/',
  Wallet = '/wallet',
  Send = '/send',
  Receive = '/receive',
  History = '/history',
  Addresses = '/addresses',
  Settings = '/settings/general',
  SettingsGeneral = '/settings/general',
  SettingsWallets = '/settings/wallets',
  SettingsNetwork = '/settings/network',
  CreateWallet = '/wallets/new',
  ImportWallet = '/wallets/import',
  WalletWizard = '/wallets/wizard',
}
