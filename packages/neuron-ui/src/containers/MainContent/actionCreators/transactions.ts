import { MainActions } from '../reducer'
import { transactions, GetTransactionsParams, TransactionsMethod } from '../../../services/UILayer'

export default {
  getTransaction: (hash: string) => {
    transactions(TransactionsMethod.Show, hash)
    return {
      type: MainActions.UpdateLoading,
      payload: {
        transaction: true,
      },
    }
  },

  getTransactions: (params: GetTransactionsParams) => {
    transactions(TransactionsMethod.Index, params)
    return {
      type: MainActions.UpdateLoading,
      payload: {
        transactions: true,
      },
    }
  },
}
