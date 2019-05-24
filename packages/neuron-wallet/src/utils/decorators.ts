import { ResponseCode } from '../controllers'

export const CatchControllerError = (_target: any, _name: string, descripor: PropertyDescriptor) => {
  const originalMethod = descripor.value
  return {
    ...descripor,
    async value(...args: any[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (err) {
        return {
          status: ResponseCode.Fail,
          msg: err.message,
        }
      }
    },
  }
}

export default {
  CatchControllerError,
}
