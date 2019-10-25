import { ResponseCode } from 'utils/const'
import logger from 'utils/logger'

const NODE_DISCONNECTED_CODE = 104

export const CatchControllerError = (target: any, name: string, descriptor: PropertyDescriptor) => {
  const originalMethod = descriptor.value
  return {
    ...descriptor,
    async value(...args: any[]) {
      try {
        return await originalMethod(...args)
      } catch (err) {
        logger.error(`${target.name}.${name}:`, err)
        if (err.code === 'ECONNREFUSED') {
          err.code = NODE_DISCONNECTED_CODE
        }
        return {
          status: err.code || ResponseCode.Fail,
          message: typeof err.message === 'string' ? { content: err.message } : err.message,
        }
      }
    },
  }
}

export default {
  CatchControllerError,
}
