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
  createOrUpdateWallet: (
    params:
      | { name: string; address: string; publicKey: Uint8Array }
      | { id: string; name?: string; address?: string; publicKey?: Uint8Array },
    password: string,
  ) => {
    // verification
    if ('id' in params) {
      // update
      walletsCall.update({
        ...params,
        password,
      })
    } else {
      // create
      // walletsCall.create({ ...params, password })
    }
    return {
      type: MainActions.Wallet,
      payload: params,
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
