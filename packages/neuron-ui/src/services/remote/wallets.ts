import { controllerMethodWrapper } from './controllerMethodWrapper'

const CONTROLLER_NAME = 'wallets'

export const updateWallet = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (params: Controller.UpdateWalletParams) => controller.update(params)
)
export const getCurrentWallet = controllerMethodWrapper(CONTROLLER_NAME)(controller => () => controller.getCurrent())
export const getWalletList = controllerMethodWrapper(CONTROLLER_NAME)(controller => () => controller.getAll())
export const importMnemonic = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (params: Controller.ImportMnemonicParams) => controller.importMnemonic(params)
)

export const deleteWallet = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (params: Controller.DeleteWalletParams) => controller.delete(params)
)

export const backupWallet = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (params: Controller.DeleteWalletParams) => controller.backup(params)
)

export const setCurrentWallet = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (id: Controller.SetCurrentWalletParams) => controller.activate(id)
)
export const sendCapacity = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (params: Controller.SendTransaction) => controller.sendCapacity(params)
)

export const getAddressesByWalletID = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (walletID: Controller.GetAddressesByWalletIDParams) => controller.getAllAddresses(walletID)
)

export const updateAddressDescription = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (params: Controller.UpdateAddressDescriptionParams) => controller.updateAddressDescription(params)
)

export default {
  updateWallet,
  getWalletList,
  importMnemonic,
  deleteWallet,
  backupWallet,
  getCurrentWallet,
  sendCapacity,
  getAddressesByWalletID,
  updateAddressDescription,
}
