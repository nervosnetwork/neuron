export enum ResponseCode {
  Fail,
  Success,
}
export interface Response<T = any> {
  status: ResponseCode
  msg?: string
  result?: T
}

export default undefined
