import { MainActions } from '../reducer'
import { transactionsCall, GetTransactionsParams } from '../../../services/UILayer'

export default {
  getTransaction: (hash: string) => {
    transactionsCall.get(hash)
    return {
      type: MainActions.UpdateLoading,
      payload: {
        transaction: true,
      },
    }
  },

  getTransactions: (params: GetTransactionsParams) => {
    transactionsCall.getAll(params)
    return {
      type: MainActions.UpdateLoading,
      payload: {
        transactions: true,
      },
    }
  },
}
