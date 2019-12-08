import { apiWrapper } from './apiMethodWrapper'

export interface GetTransactionListParams {
  pageNo: number
  pageSize: number
  keywords?: string
  walletID: string
}

export const getTransactionList = apiWrapper<GetTransactionListParams>('get-transaction-list')

export const getTransaction = apiWrapper<{ walletID: string; hash: string }>('get-transaction')

export const updateTransactionDescription = apiWrapper<Controller.UpdateTransactionDescriptionParams>(
  'update-transaction-description'
)

// param: txhash
export const showTransactionDetails = apiWrapper<string>('show-transaction-details')

export default {
  getTransactionList,
  getTransaction,
  updateTransactionDescription,
  showTransactionDetails,
}
