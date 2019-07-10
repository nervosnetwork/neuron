import { transactionsCall, GetTransactionsParams, walletsCall } from 'services/UILayer'
import { AppActions } from '../reducer'

export default {
  getTransaction: (walletID: string, hash: string) => {
    transactionsCall.get(walletID, hash)
    return {
      type: AppActions.Ignore,
      payload: null,
    }
  },

  getTransactions: (params: GetTransactionsParams) => {
    transactionsCall.getAllByKeywords(params)
    return {
      type: AppActions.Ignore,
      payload: null,
    }
  },
  updateDescription: ({
    type,
    walletID,
    key,
    description,
  }: {
    type: 'address' | 'transaction'
    walletID: string
    key: string
    description: string
  }) => {
    if (type === 'address') {
      walletsCall.updateAddressDescription({
        walletID,
        address: key,
        description,
      })
      return {
        type: AppActions.Ignore,
        payload: null,
      }
    }
    if (type === 'transaction') {
      transactionsCall.updateDescription({
        hash: key,
        description,
      })
      return {
        type: AppActions.Ignore,
        payload: null,
      }
    }
    return {
      type: AppActions.Ignore,
      payload: null,
    }
  },
}
