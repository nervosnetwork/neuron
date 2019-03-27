import { initState, MainActions } from '../reducer'
import { wallets, WalletsMethod } from '../../../services/UILayer'

export default {
  setActiveWallet: (id: string) => {
    wallets(WalletsMethod.SetActive, id)
    return {
      type: MainActions.Wallet,
      payload: id,
    }
  },
  backupWallet: (id: string) => {
    wallets(WalletsMethod.Backup, id)
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
      wallets(WalletsMethod.Update, {
        ...params,
        password,
      })
    } else {
      // create
      wallets(WalletsMethod.Create, {
        ...params,
        password,
      })
    }
    return {
      type: MainActions.Wallet,
      payload: params,
    }
  },
  deleteWallet: (id: string, password: string) => {
    wallets(WalletsMethod.Delete, {
      id,
      password,
    })
    return {
      type: MainActions.Wallet,
      payload: id,
    }
  },
  importWallet: (params: typeof initState.tempWallet) => {
    wallets(WalletsMethod.Import, params)
    return {
      type: MainActions.Wallet,
    }
  },
  exportWallet: (id: string) => {
    wallets(WalletsMethod.Export, id)
    return {
      type: MainActions.Wallet,
    }
  },
}
