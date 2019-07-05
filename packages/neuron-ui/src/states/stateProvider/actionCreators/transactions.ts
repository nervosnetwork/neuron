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
    key,
    description,
  }: {
    type: 'address' | 'transaction'
    key: string
    description: string
  }) => {
    if (type === 'address') {
      walletsCall.updateAddressDescription({
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
