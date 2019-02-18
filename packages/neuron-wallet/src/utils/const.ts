export enum IPCChannel {
  // Chain
  GetBlock = 'getBlock',
  GetTransaction = 'getTransaction',
  GetLiveCell = 'getLiveCell',
  GetTipHeader = 'getTipHeader',
  GetTipBlockNumber = 'getTipBlockNumber',
  GetLocalNodeId = 'getLocalNodeId',
  GetNetwork = 'getNetwork',
  GwitchNetwork = 'switchNetwork',

  // Wallet
  CreateWallet = 'createWallet',
  ImportWallet = 'importWallet',
  ExportWallet = 'exportWallet',
  SwitchAccount = 'switchAccount',
  GetBalance = 'getBalance',
  GetCellsByTypeHash = 'getCellsByTypeHash',
  GetUnspentCells = 'getUnspentCells',
  GetTransactions = 'getTransactions',
  GetWallets = 'getWallets',
  SendCapacity = 'sendCapacity',
  SendTransaction = 'sendTransaction',
  Sign = 'sign',
}

export default {
  IPCChannel,
}
