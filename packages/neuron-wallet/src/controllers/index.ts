export enum ResponseCode {
  Fail,
  Success,
}
export interface Response<T = any> {
  status: ResponseCode
  msg?: string
  result?: T
}
class Controller {}

export default Controller
