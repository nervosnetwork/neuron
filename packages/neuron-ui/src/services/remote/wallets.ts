import { apiWrapper } from './apiMethodWrapper'

export const getWalletList = apiWrapper<void>('get-all-wallets')
export const getCurrentWallet = apiWrapper<void>('get-current-wallet')
export const setCurrentWallet = apiWrapper<Controller.SetCurrentWalletParams>('set-current-wallet')
export const importMnemonic = apiWrapper<Controller.ImportMnemonicParams>('import-mnemonic')
export const importKeystore = apiWrapper<Controller.ImportKeystoreParams>('import-keystore')
export const createWallet = apiWrapper<Controller.CreateWalletParams>('create-wallet')
export const updateWallet = apiWrapper<Controller.UpdateWalletParams>('update-wallet')
export const deleteWallet = apiWrapper<Controller.DeleteWalletParams>('delete-wallet')
export const backupWallet = apiWrapper<Controller.DeleteWalletParams>('backup-wallet')
export const getAddressesByWalletID = apiWrapper<Controller.GetAddressesByWalletIDParams>('get-all-addresses')
export const updateAddressDescription = apiWrapper<Controller.UpdateAddressDescriptionParams>(
  'update-address-description'
)
export const requestPassword = apiWrapper<Controller.RequestPasswordParams>('request-password')
export const sendTx = apiWrapper<Controller.SendTransactionParams>('send-tx')
export const generateTx = apiWrapper<Controller.GenerateTransactionParams>('generate-tx')
export const generateSendingAllTx = apiWrapper<Controller.GenerateSendingAllTransactionParams>('generate-send-all-tx')

// Dao
export const getDaoData = apiWrapper<Controller.GetNervosDaoDataParams>('get-dao-data')
export const generateDaoDepositTx = apiWrapper<Controller.DepositParams>('generate-dao-deposit-tx')
export const generateDaoDepositAllTx = apiWrapper<Controller.GenerateDepositAllTransactionParams>(
  'generate-dao-deposit-all-tx'
)
export const generateDaoWithdrawTx = apiWrapper<Controller.WithdrawParams>('start-withdraw-from-dao')
export const generateDaoClaimTx = apiWrapper<Controller.ClaimParams>('withdraw-from-dao')
