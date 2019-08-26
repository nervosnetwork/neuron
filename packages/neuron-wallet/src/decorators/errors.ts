import { ResponseCode } from 'utils/const'

export const CatchControllerError = (_target: any, _name: string, descriptor: PropertyDescriptor) => {
  const originalMethod = descriptor.value
  return {
    ...descriptor,
    async value(...args: any[]) {
      try {
        return await originalMethod(...args)
      } catch (err) {
        return {
          status: ResponseCode.Fail,
          message: typeof err.message === 'string' ? { content: err.message } : err.message,
        }
      }
    },
  }
}

export default {
  CatchControllerError,
}
