import { remoteApi } from './remoteApiWrapper'

export const getWalletList = remoteApi<void>('get-all-wallets')
export const getCurrentWallet = remoteApi<void>('get-current-wallet')
export const setCurrentWallet = remoteApi<Controller.SetCurrentWalletParams>('set-current-wallet')
export const importMnemonic = remoteApi<Controller.ImportMnemonicParams>('import-mnemonic')
export const importKeystore = remoteApi<Controller.ImportKeystoreParams>('import-keystore')
export const createWallet = remoteApi<Controller.CreateWalletParams>('create-wallet')
export const updateWallet = remoteApi<Controller.UpdateWalletParams>('update-wallet')
export const deleteWallet = remoteApi<Controller.DeleteWalletParams>('delete-wallet')
export const backupWallet = remoteApi<Controller.DeleteWalletParams>('backup-wallet')
export const getAddressesByWalletID = remoteApi<Controller.GetAddressesByWalletIDParams>('get-all-addresses')
export const updateAddressDescription = remoteApi<Controller.UpdateAddressDescriptionParams>(
  'update-address-description'
)
export const requestPassword = remoteApi<Controller.RequestPasswordParams>('request-password')
export const sendTx = remoteApi<Controller.SendTransactionParams>('send-tx')
export const generateTx = remoteApi<Controller.GenerateTransactionParams>('generate-tx')
export const generateSendingAllTx = remoteApi<Controller.GenerateSendingAllTransactionParams>('generate-send-all-tx')
export const generateMnemonic = remoteApi<void>('generate-mnemonic')
export const validateMnemonic = remoteApi<string>('validate-mnemonic')

// Dao
export const getDaoData = remoteApi<Controller.GetNervosDaoDataParams>('get-dao-data')
export const generateDaoDepositTx = remoteApi<Controller.DepositParams>('generate-dao-deposit-tx')
export const generateDaoDepositAllTx = remoteApi<Controller.GenerateDepositAllTransactionParams>(
  'generate-dao-deposit-all-tx'
)
export const generateDaoWithdrawTx = remoteApi<Controller.WithdrawParams>('start-withdraw-from-dao')
export const generateDaoClaimTx = remoteApi<Controller.ClaimParams>('withdraw-from-dao')
