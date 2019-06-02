declare module Controller {
  interface Response<T = any> {
    status: ResponseCode
    msg?: string
    result?: T
  }
}
