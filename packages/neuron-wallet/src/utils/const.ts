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

export default {
  Channel,
}
