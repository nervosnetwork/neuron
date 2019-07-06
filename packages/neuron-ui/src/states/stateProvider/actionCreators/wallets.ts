import { AppActions } from 'states/stateProvider/reducer'
import { walletsCall } from 'services/UILayer'
import { NeuronWalletActions } from '../reducer'

export default {
  getAll: () => {
    walletsCall.getAll()
    return {
      type: NeuronWalletActions.Wallet,
    }
  },
  activateWallet: (id: string) => {
    walletsCall.activate(id)
    return {
      type: NeuronWalletActions.Wallet,
      payload: id,
    }
  },
  updateWallet: (params: { id: string; password?: string; newPassword?: string; name?: string }) => {
    walletsCall.update(params)
    return {
      type: AppActions.Ignore,
      payload: null,
    }
  },
}
