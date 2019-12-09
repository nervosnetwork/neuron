import { apiMethodWrapper, apiWrapper } from './apiMethodWrapper'

export const updateWallet = apiMethodWrapper(api => (params: Controller.UpdateWalletParams) => api.updateWallet(params))

export const getCurrentWallet = apiMethodWrapper<void>(api => () => api.getCurrentWallet())

export const getWalletList = apiMethodWrapper<void>(api => () => api.getAllWallets())

export const createWallet = apiMethodWrapper(api => (params: Controller.CreateWalletParams) => api.createWallet(params))

export const importMnemonic = apiMethodWrapper(api => (params: Controller.ImportMnemonicParams) =>
  api.importMnemonic(params)
)

export const importKeystore = apiMethodWrapper(api => (params: Controller.ImportKeystoreParams) =>
  api.importKeystore(params)
)

export const deleteWallet = apiMethodWrapper(api => (params: Controller.DeleteWalletParams) => api.deleteWallet(params))

export const backupWallet = apiMethodWrapper(api => (params: Controller.DeleteWalletParams) => api.backupWallet(params))

export const setCurrentWallet = apiMethodWrapper(api => (id: Controller.SetCurrentWalletParams) =>
  api.setCurrentWallet(id)
)

export const generateTx = apiMethodWrapper(api => (params: Controller.GenerateTransactionParams) =>
  api.generateTx(params)
)

export const generateSendingAllTx = apiMethodWrapper(api => (params: Controller.GenerateSendingAllTransactionParams) =>
  api.generateSendingAllTx(params)
)

export const requestPassword = apiMethodWrapper<Controller.RequestPasswordParams>(api => params =>
  api.requestPassword(params)
)

export const sendTx = apiMethodWrapper(api => (params: Controller.SendTransactionParams) => api.sendTx(params))

export const getAddressesByWalletID = apiMethodWrapper(api => (walletID: Controller.GetAddressesByWalletIDParams) =>
  api.getAddressesByWalletID(walletID)
)

export const updateAddressDescription = apiMethodWrapper(api => (params: Controller.UpdateAddressDescriptionParams) =>
  api.updateAddressDescription(params)
)

export const getDaoData = apiWrapper<Controller.GetNervosDaoDataParams>('get-dao-data')
export const generateDaoDepositTx = apiWrapper<Controller.DepositParams>('generate-dao-deposit-tx')
export const generateDaoDepositAllTx = apiWrapper<Controller.GenerateDepositAllTransactionParams>(
  'generate-dao-deposit-all-tx'
)
export const generateDaoWithdrawTx = apiWrapper<Controller.WithdrawParams>('start-withdraw-from-dao')
export const generateDaoClaimTx = apiWrapper<Controller.ClaimParams>('withdraw-from-dao')
