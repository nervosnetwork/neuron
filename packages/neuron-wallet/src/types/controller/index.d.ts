declare module Controller {
  interface Response<T = any> {
    status: number
    msg?: string
    result?: T
  }

  namespace Params {
    interface TransactionsByAddresses {
      pageNo: number
      pageSize: number
      addresses: string
    }
  }
}
