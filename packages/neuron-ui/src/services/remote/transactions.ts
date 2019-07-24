import { controllerMethodWrapper } from './controllerMethodWrapper'

export interface GetTransactionListParams {
  pageNo: number
  pageSize: number
  keywords?: string
  walletID: string
}

const CONTROLLER_NAME = 'transactions'

export const getTransactionList = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (params: GetTransactionListParams) => {
    return controller.getAllByKeywords(params)
  }
)

export const getTransaction = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => ({ walletID, hash }: { walletID: string; hash: string }) => {
    return controller.get(walletID, hash)
  }
)
export const updateTransactionDescription = controllerMethodWrapper(CONTROLLER_NAME)(
  controller => (params: { hash: string; description: string }) => {
    return controller.updateDescription(params)
  }
)

export default {
  getTransactionList,
  getTransaction,
}
