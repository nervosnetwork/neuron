import { apiMethodWrapper } from './apiMethodWrapper'

export const updateWallet = apiMethodWrapper()(api => (params: Controller.UpdateWalletParams) =>
  api.updateWallet(params)
)

export const getCurrentWallet = apiMethodWrapper()(api => () => api.getCurrentWallet())

export const getWalletList = apiMethodWrapper()(api => () => api.getAllWallets())

export const createWallet = apiMethodWrapper()(api => (params: Controller.CreateWalletParams) =>
  api.createWallet(params)
)

export const importMnemonic = apiMethodWrapper()(api => (params: Controller.ImportMnemonicParams) =>
  api.importMnemonic(params)
)

export const importKeystore = apiMethodWrapper()(api => (params: Controller.ImportKeystoreParams) =>
  api.importKeystore(params)
)

export const deleteWallet = apiMethodWrapper()(api => (params: Controller.DeleteWalletParams) =>
  api.deleteWallet(params)
)

export const backupWallet = apiMethodWrapper()(api => (params: Controller.DeleteWalletParams) =>
  api.backupWallet(params)
)

export const setCurrentWallet = apiMethodWrapper()(api => (id: Controller.SetCurrentWalletParams) =>
  api.setCurrentWallet(id)
)

export const sendCapacity = apiMethodWrapper()(api => (params: Controller.SendTransaction) => api.sendCapacity(params))

export const getAddressesByWalletID = apiMethodWrapper()(api => (walletID: Controller.GetAddressesByWalletIDParams) =>
  api.getAddressesByWalletID(walletID)
)

export const updateAddressDescription = apiMethodWrapper()(api => (params: Controller.UpdateAddressDescriptionParams) =>
  api.updateAddressDescription(params)
)

export const calculateCycles = apiMethodWrapper()(api => (params: Controller.ComputeCycles) =>
  api.computeCycles(params)
)

export default {
  updateWallet,
  getWalletList,
  createWallet,
  importMnemonic,
  importKeystore,
  deleteWallet,
  backupWallet,
  getCurrentWallet,
  sendCapacity,
  calculateCycles,
  getAddressesByWalletID,
  updateAddressDescription,
}
