import { apiMethodWrapper, apiWrapper } from './apiMethodWrapper'

export interface GetTransactionListParams {
  pageNo: number
  pageSize: number
  keywords?: string
  walletID: string
}

export const getTransactionList = apiWrapper<GetTransactionListParams>('get-transaction-list')

export const getTransaction = apiMethodWrapper(api => ({ walletID, hash }: { walletID: string; hash: string }) => {
  return api.getTransaction(walletID, hash)
})

export const updateTransactionDescription = apiMethodWrapper(
  api => (params: Controller.UpdateTransactionDescriptionParams) => {
    return api.updateTransactionDescription(params)
  }
)

export const showTransactionDetails = apiMethodWrapper(controller => (hash: string) =>
  controller.showTransactionDetails(hash)
)

export default {
  getTransactionList,
  getTransaction,
  updateTransactionDescription,
  showTransactionDetails,
}
