import { initState, MainActions } from '../reducer'
import { walletsCall } from '../../../services/UILayer'

export default {
  getAll: () => {
    walletsCall.getAll()
    return {
      type: MainActions.Wallet,
    }
  },
  getActiveWallet: () => {
    walletsCall.getActive()
    return {
      type: MainActions.Wallet,
    }
  },
  activateWallet: (id: string) => {
    walletsCall.activate(id)
    return {
      type: MainActions.Wallet,
      payload: id,
    }
  },
  deleteWallet(params: { id: string; password: string }) {
    walletsCall.delete(params)
    return {
      type: MainActions.Wallet,
    }
  },
  backupWallet: (id: string) => {
    walletsCall.backup(id)
    return {
      type: MainActions.Wallet,
      payload: id,
    }
  },
  importMnemonic: (params: { name: string; password: string; mnemonic: string }) => {
    walletsCall.importMnemonic(params)
    return {
      type: MainActions.Wallet,
    }
  },
  importKeystore: (params: { name: string; keystore: string; password: string }) => {
    walletsCall.importKeystore(params)
    return {
      type: MainActions.Wallet,
    }
  },
  updateWallet: (params: { id: string; password: string; newPassword?: string; name?: string }) => {
    walletsCall.update(params)
    return {
      type: MainActions.Wallet,
    }
  },
  importWallet: (isKeystore: boolean, params: typeof initState.tempWallet) => {
    if (isKeystore) {
      walletsCall.importKeystore(params)
    } else {
      walletsCall.importMnemonic(params)
    }
    return {
      type: MainActions.Wallet,
    }
  },
  exportWallet: (id: string) => {
    walletsCall.export(id)
    return {
      type: MainActions.Wallet,
    }
  },
}
