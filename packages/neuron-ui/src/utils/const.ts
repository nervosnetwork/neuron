export enum NETWORK_STATUS {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum IPC_CHANNEL {
  SEND_CAPACITY = 'sendCapacity',
  GET_CELLS_BY_TYPE_HASH = 'getCellsByTypeHash',
}

export enum Routes {
  Home = '/',
  Wallet = '/wallet',
  Send = '/send',
  Receive = '/receive',
  History = '/history',
  Addresses = '/addresses',
  Settings = '/settings',
  Wizard = '/wizard',
  CreateWallet = '/wallets/new',
  ImportWallet = '/wallets/import',
  WalletWizard = '/wallets/wizard',
}
