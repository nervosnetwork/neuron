export enum Channel {
  Initiate = 'initiate',
  SetLanguage = 'setLanguage',
  GetTipBlockNumber = 'getTipBlockNumber',

  DeleteWallet = 'deleteWallet',
  EditWallet = 'editWallet',
  SwitchWallet = 'switchWallet',
  GetBalance = 'getBalance',
  GetTransactions = 'getTransactions',
  CheckWalletPassword = 'checkWalletPassword',
  GetWallets = 'getWallets',
  SendCapacity = 'sendCapacity',
  NavTo = 'navTo',
  Terminal = 'terminal',
  Networks = 'networks',
  Wallets = 'wallets',
  Transactions = 'transactions',
  Helpers = 'helpers',
}

export default {
  Channel,
}
