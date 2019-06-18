import { MainActions } from '../reducer'
import { transactionsCall, GetTransactionsParams, UpdateDescriptionParams } from '../../../services/UILayer'

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
    transactionsCall.getAllByAddresses(params)
    return {
      type: MainActions.UpdateLoading,
      payload: {
        transactions: true,
      },
    }
  },
  updateDescription: (params: UpdateDescriptionParams) => {
    transactionsCall.updateDescription(params)
    return {
      type: MainActions.UpdateTransactionDescription,
      payload: params.key,
    }
  },
}
