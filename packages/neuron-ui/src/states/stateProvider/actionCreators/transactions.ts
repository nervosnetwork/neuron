import { NeuronWalletActions, StateDispatch } from 'states/stateProvider/reducer'
import {
  GetTransactionListParams,
  getTransactionList,
  updateTransactionDescription as updateRemoteTransactionDescription,
} from 'services/remote'
import { failureResToNotification } from 'utils/formatters'
import { addNotification } from './app'

export const updateTransactionList = (params: GetTransactionListParams) => (dispatch: StateDispatch) => {
  getTransactionList(params).then(res => {
    if (res.status === 1) {
      dispatch({
        type: NeuronWalletActions.UpdateTransactionList,
        payload: res.result,
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const updateTransactionDescription = (params: Controller.UpdateTransactionDescriptionParams) => (
  dispatch: StateDispatch
) => {
  const descriptionParams = {
    hash: params.hash,
    description: params.description,
  }
  dispatch({
    type: NeuronWalletActions.UpdateTransactionDescription,
    payload: descriptionParams,
  }) // update local description before remote description to avoid the flicker on the field
  updateRemoteTransactionDescription(params).then(res => {
    if (res.status === 1) {
      dispatch({
        type: NeuronWalletActions.UpdateTransactionDescription,
        payload: descriptionParams,
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export default {
  updateTransactionList,
}
