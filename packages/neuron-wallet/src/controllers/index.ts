export enum ResponseCode {
  Fail,
  Success,
}
export interface ChannelResponse<T = any> {
  status: ResponseCode
  msg?: string
  result?: T
}

export default undefined
