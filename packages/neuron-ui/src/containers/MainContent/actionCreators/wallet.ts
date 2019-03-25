import { initState, MainActions } from '../reducer'
import { createWallet, importWallet, exportWallet } from '../../../services/UILayer'

export default {
  createWallet: (wallet: typeof initState.tempWallet) => {
    createWallet(wallet)
    return {
      type: MainActions.CreateWallet,
    }
  },
  importWallet: (wallet: typeof initState.tempWallet) => {
    importWallet(wallet)
    return {
      type: MainActions.ImportWallet,
    }
  },
  exportWallet: () => {
    exportWallet()
    return {
      type: MainActions.ExportWallet,
    }
  },
}
