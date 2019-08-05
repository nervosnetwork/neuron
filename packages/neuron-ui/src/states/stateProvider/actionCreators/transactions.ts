import { NeuronWalletActions, AppActions, StateDispatch } from 'states/stateProvider/reducer'
import {
  GetTransactionListParams,
  getTransactionList,
  updateTransactionDescription as updateRemoteTransactionDescription,
} from 'services/remote'
import { addNotification } from './app'

export const updateTransactionList = (params: GetTransactionListParams) => (dispatch: StateDispatch) => {
  getTransactionList(params).then(res => {
    if (res.status) {
      dispatch({
        type: NeuronWalletActions.UpdateTransactionList,
        payload: res.result,
      })
    } else {
      addNotification({ type: 'alert', content: res.message.title })(dispatch)
    }
  })
}

export const updateTransactionDescription = (params: Controller.UpdateTransactionDescriptionParams) => (
  dispatch: StateDispatch
) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: {
      updateDescription: true,
    },
  })
  updateRemoteTransactionDescription(params)
    .then(res => {
      if (res.status) {
        dispatch({
          type: NeuronWalletActions.UpdateTransactionDescription,
          payload: {
            hash: params.hash,
            description: params.description,
          },
        })
      } else {
        addNotification({ type: 'alert', content: res.message.title })(dispatch)
      }
    })
    .finally(() => {
      dispatch({
        type: AppActions.UpdateLoadings,
        payload: {
          updateDescription: false,
        },
      })
    })
}

export default {
  updateTransactionList,
}
