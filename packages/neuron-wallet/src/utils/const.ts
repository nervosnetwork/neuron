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
  GetWallets = 'getWallets',
  SendCapacity = 'sendCapacity',
  SendTransaction = 'sendTransaction',
  Sign = 'sign',

  // Page
  NavTo = 'navTo',

  // Store
  SaveWalletStore = 'saveWalletStore',
  GetWalletNameListStore = 'getWalletNameListStore',
  GetWalletStore = 'getWalletStore',
  DeleteWalletStore = 'deleteWalletStore',
  OtherStore = 'otherStore',
  RenameWalletStore = 'renameWalletStore',
}

export default {
  Channel,
}
