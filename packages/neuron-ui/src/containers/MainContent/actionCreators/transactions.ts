import { MainActions } from '../reducer'
import { transactionsCall, GetTransactionsParams } from '../../../services/UILayer'

export default {
  getTransaction: (hash: string) => {
    transactionsCall.show(hash)
    return {
      type: MainActions.UpdateLoading,
      payload: {
        transaction: true,
      },
    }
  },

  getTransactions: (params: GetTransactionsParams) => {
    transactionsCall.index(params)
    return {
      type: MainActions.UpdateLoading,
      payload: {
        transactions: true,
      },
    }
  },
}
