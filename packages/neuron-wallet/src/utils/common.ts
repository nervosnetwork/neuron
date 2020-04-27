import logger from 'utils/logger'

export default class CommonUtils {
  public static sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public static async retry<T>(times: number, interval: number, callback: () => T): Promise<T> {
    let retryTime = 0

    while (++retryTime < times) {
      try {
        return callback()
      } catch (err) {
        logger.warn(`function call error: ${err}, retry ${retryTime+1} ...`)
        await CommonUtils.sleep(interval)
      }
    }
    return callback()
  }

  public static timeout<T>(time: number, promise: Promise<T>, value: T): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((resolve, _) => {
        setTimeout(() => resolve(value), time)
      })
    ])
  }
}
