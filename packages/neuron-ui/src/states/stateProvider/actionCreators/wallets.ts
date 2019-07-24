import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { walletsCall } from 'services/UILayer'
import { NeuronWalletActions } from '../reducer'

export const activateWallet = (id: string) => (dispatch: StateDispatch) => {
  walletsCall.activate(id)
  dispatch({
    type: NeuronWalletActions.Wallet,
    payload: id,
  })
}

export const updateWallet = (params: { id: string; password?: string; newPassword?: string; name?: string }) => (
  dispatch: StateDispatch
) => {
  walletsCall.update(params)
  dispatch({
    type: AppActions.Ignore,
    payload: null,
  })
}

export default {
  updateWallet,
  activateWallet,
}
