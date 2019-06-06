declare module Controller {
  interface Response<T = any> {
    status: number
    msg?: string
    result?: T
  }
}
