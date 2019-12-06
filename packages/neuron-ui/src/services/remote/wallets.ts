import { apiMethodWrapper } from './apiMethodWrapper'

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

export const generateDepositAllTx = apiMethodWrapper<Controller.GenerateDepositAllTransactionParams>(api => params =>
  api.generateDepositAllTx(params)
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

export const getNervosDaoData = apiMethodWrapper(api => (params: Controller.GetNervosDaoDataParams) =>
  api.getDaoCells(params)
)

export const generateDepositTx = apiMethodWrapper(api => (params: Controller.DepositParams) =>
  api.generateDepositTx(params)
)

export const generateWithdrawTx = apiMethodWrapper(api => (params: Controller.WithdrawParams) =>
  api.startWithdrawFromDao(params)
)

export const generateClaimTx = apiMethodWrapper(api => (params: Controller.ClaimParams) => api.withdrawFromDao(params))

export default {
  updateWallet,
  getWalletList,
  createWallet,
  importMnemonic,
  importKeystore,
  deleteWallet,
  backupWallet,
  getCurrentWallet,
  generateTx,
  generateSendingAllTx,
  generateDepositAllTx,
  requestPassword,
  sendTx,
  getAddressesByWalletID,
  updateAddressDescription,
  getNervosDaoData,
  generateDepositTx,
  generateWithdrawTx,
  generateClaimTx,
}
