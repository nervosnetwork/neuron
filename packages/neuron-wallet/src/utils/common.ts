import logger from '../utils/logger'

export default class CommonUtils {
  public static sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public static async retry<T>(times: number, interval: number, callback: () => T): Promise<Awaited<T>> {
    let retryTime = 0

    while (++retryTime < times) {
      try {
        return await (callback() as Awaited<T>)
      } catch (err) {
        logger.warn(`function call error: ${err}, retry ${retryTime + 1} ...`)
        await CommonUtils.sleep(interval)
      }
    }
    return await (callback() as Awaited<T>)
  }

  public static timeout<T>(time: number, promise: Promise<T>, value: T): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((resolve, _) => {
        setTimeout(() => resolve(value), time)
      }),
    ])
  }

  public static tryParseError(message: any) {
    try {
      const json = JSON.parse(message)
      if (json.message) {
        return json.message
      }
      return message
    } catch (error) {
      return message
    }
  }
}
