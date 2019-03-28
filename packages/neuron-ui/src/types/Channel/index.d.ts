interface ChannelResponse<T> {
  status: number
  result: T
  msg?: string
}
