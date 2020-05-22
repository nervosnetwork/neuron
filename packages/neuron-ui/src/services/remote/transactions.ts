import { remoteApi } from './remoteApiWrapper'

export interface GetTransactionListParams {
  pageNo: number
  pageSize: number
  keywords?: string
  walletID: string
}

export const getTransactionList = remoteApi<GetTransactionListParams>('get-transaction-list')
export const getTransaction = remoteApi<{ walletID: string; hash: string }>('get-transaction')
export const updateTransactionDescription = remoteApi<Controller.UpdateTransactionDescriptionParams>(
  'update-transaction-description'
)
export const exportTransactions = remoteApi<Controller.ExportTransactions.Params>('export-transactions')
export const showTransactionDetails = remoteApi<string>('show-transaction-details')
