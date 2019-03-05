declare interface Response<T> {
  status: number
  result: T
  msg?: string
}
