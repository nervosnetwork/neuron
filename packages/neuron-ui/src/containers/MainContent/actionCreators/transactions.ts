import { transactionsCall, GetTransactionsParams, walletsCall } from 'services/UILayer'
import { MainActions } from '../reducer'

export default {
  getTransaction: (walletID: string, hash: string) => {
    transactionsCall.get(walletID, hash)
    return {
      type: MainActions.UpdateLoading,
      payload: {
        transaction: true,
      },
    }
  },

  getTransactions: (params: GetTransactionsParams) => {
    transactionsCall.getAllByKeywords(params)
    return {
      type: MainActions.UpdateLoading,
      payload: {
        transactions: true,
      },
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
        type: MainActions.UpdateTransactionDescription,
        payload: key,
      }
    }
    if (type === 'transaction') {
      transactionsCall.updateDescription({
        hash: key,
        description,
      })
      return {
        type: MainActions.UpdateTransactionDescription,
        payload: key,
      }
    }
    return {
      type: null,
      payload: null,
    }
  },
}
