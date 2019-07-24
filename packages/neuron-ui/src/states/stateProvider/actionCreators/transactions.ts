import { NeuronWalletActions, StateDispatch } from 'states/stateProvider/reducer'
import { GetTransactionListParams, getTransaction, getTransactionList } from 'services/remote'

export const updateTransaction = (params: { walletID: string; hash: string }) => (dispatch: StateDispatch) => {
  getTransaction(params).then(res => {
    if (res.status) {
      dispatch({
        type: NeuronWalletActions.UpdateTransaction,
        payload: res.result,
      })
    }
  })
}
export const updateTransactionList = (params: GetTransactionListParams) => (dispatch: StateDispatch) => {
  getTransactionList(params).then(res => {
    if (res.status) {
      dispatch({
        type: NeuronWalletActions.UpdateTransactionList,
        payload: res.result,
      })
    }
  })
}

export default {
  updateTransaction,
  updateTransactionList,
}
