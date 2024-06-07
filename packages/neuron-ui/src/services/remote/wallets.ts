import { remoteApi } from './remoteApiWrapper'

export const getWalletList = remoteApi<void>('get-all-wallets')
export const getCurrentWallet = remoteApi<void>('get-current-wallet')
export const setCurrentWallet = remoteApi<Controller.SetCurrentWalletParams>('set-current-wallet')
export const importMnemonic = remoteApi<Controller.ImportMnemonicParams>('import-mnemonic')
export const importKeystore = remoteApi<Controller.ImportKeystoreParams>('import-keystore')
export const createWallet = remoteApi<Controller.CreateWalletParams>('create-wallet')
export const updateWallet = remoteApi<Controller.UpdateWalletParams>('update-wallet')
export const deleteWallet = remoteApi<Controller.DeleteWalletParams>('delete-wallet')
export const replaceWallet = remoteApi<Controller.ReplaceWalletParams>('replace-wallet')
export const backupWallet = remoteApi<Controller.DeleteWalletParams>('backup-wallet')
export const updateWalletStartBlockNumber = remoteApi<Controller.UpdateWalletStartBlockNumberParams>(
  'update-wallet-start-block-number'
)
export const getAddressesByWalletID = remoteApi<Controller.GetAddressesByWalletIDParams>('get-all-addresses')
export const updateAddressDescription =
  remoteApi<Controller.UpdateAddressDescriptionParams>('update-address-description')
export const requestPassword = remoteApi<Controller.RequestPasswordParams>('request-password')
export const sendTx = remoteApi<Controller.SendTransactionParams>('send-tx')
export const generateTx = remoteApi<Controller.GenerateTransactionParams>('generate-tx')
export const generateSendingAllTx = remoteApi<Controller.GenerateSendingAllTransactionParams>('generate-send-all-tx')
export const generateMnemonic = remoteApi<void>('generate-mnemonic')
export const validateMnemonic = remoteApi<string>('validate-mnemonic')

// Dao
export const getDaoData = remoteApi<Controller.GetNervosDaoDataParams>('get-dao-data')
export const generateDaoDepositTx = remoteApi<Controller.DepositParams, State.GeneratedTx>('generate-dao-deposit-tx')
export const generateDaoDepositAllTx = remoteApi<Controller.GenerateDepositAllTransactionParams, State.GeneratedTx>(
  'generate-dao-deposit-all-tx'
)
export const generateDaoWithdrawTx = remoteApi<Controller.WithdrawParams>('start-withdraw-from-dao')
export const generateDaoClaimTx = remoteApi<Controller.ClaimParams>('withdraw-from-dao')
export const calculateUnlockDaoMaximumWithdraw = remoteApi<string, string>('calculate-unlock-dao-maximum-withdraw')

// Sign and Verify
export const signMessage = remoteApi<Controller.SignMessageParams>('sign-message')
export const verifyMessage = remoteApi<Controller.VerifyMessageParams, 'old-sign' | 'new-sign'>('verify-signature')
