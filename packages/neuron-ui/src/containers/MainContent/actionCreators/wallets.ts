import { initState, MainActions } from '../reducer'
import { walletsCall } from '../../../services/UILayer'

export default {
  setActiveWallet: (id: string) => {
    walletsCall.setActive(id)
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
  deleteWallet: (id: string, password: string) => {
    walletsCall.delete({
      id,
      password,
    })
    return {
      type: MainActions.Wallet,
      payload: id,
    }
  },
  importWallet: (params: typeof initState.tempWallet) => {
    walletsCall.import(params)
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
