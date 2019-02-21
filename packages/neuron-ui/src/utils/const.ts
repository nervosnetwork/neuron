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
  Settings = '/settings',
  CreateWallet = '/wallets/new',
  ImportWallet = '/wallets/import',
  WalletWizard = '/wallets/wizard',
}
