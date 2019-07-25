import { NeuronWalletActions, AppActions, StateDispatch } from 'states/stateProvider/reducer'
import {
  GetTransactionListParams,
  getTransaction,
  getTransactionList,
  updateTransactionDescription as updateRemoteTransactionDescription,
} from 'services/remote'
import { addNotification } from './app'

export const updateTransaction = (params: { walletID: string; hash: string }) => (dispatch: StateDispatch) => {
  getTransaction(params).then(res => {
    if (res.status) {
      dispatch({
        type: NeuronWalletActions.UpdateTransaction,
        payload: res.result,
      })
    } else {
      addNotification({ type: 'alert', content: res.message.title })(dispatch)
    }
  })
}
export const updateTransactionList = (params: GetTransactionListParams) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: {
      transactionList: true,
    },
  })
  getTransactionList(params)
    .then(res => {
      if (res.status) {
        dispatch({
          type: NeuronWalletActions.UpdateTransactionList,
          payload: res.result,
        })
      } else {
        addNotification({ type: 'alert', content: res.message.title })(dispatch)
      }
    })
    .finally(() => {
      dispatch({
        type: AppActions.UpdateLoadings,
        payload: {
          transactionList: false,
        },
      })
    })
}

export const updateTransactionDescription = (params: Controller.UpdateTransactionDescriptionParams) => (
  dispatch: StateDispatch
) => {
  updateRemoteTransactionDescription(params).then(res => {
    if (res.status) {
      dispatch({ type: AppActions.Ignore, payload: null })
    } else {
      addNotification({ type: 'alert', content: res.message.title })(dispatch)
    }
  })
}

export default {
  updateTransaction,
  updateTransactionList,
}
