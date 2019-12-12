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
        await CommonUtils.sleep(interval)
      }
    }
    return callback()
  }
}
