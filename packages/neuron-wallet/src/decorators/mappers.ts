import { ResponseCode } from 'utils/const'
import logger from 'utils/logger'

const NODE_DISCONNECTED_CODE = 104

export const MapApiResponse = (target: any, name: string, descriptor: PropertyDescriptor) => {
  const originalMethod = descriptor.value
  return {
    ...descriptor,
    async value(...args: any[]): Promise<any> {
      try {
        const res = await originalMethod(...args)
        return JSON.stringify(res)
      } catch (err) {
        logger.error(`${target.name}.${name}:`, err)
        if (err.code === 'ECONNREFUSED') {
          err.code = NODE_DISCONNECTED_CODE
        }
        const res = {
          status: err.code || ResponseCode.Fail,
          message: typeof err.message === 'string' ? { content: err.message } : err.message,
        }
        return JSON.stringify(res)
      }
    },
  }
}

export default { MapApiResponse }
