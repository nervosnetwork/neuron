import logger from 'utils/logger'

//TODO remove it after typescript upgrade to above 4.5
type Awaited<T> = T extends null | undefined
  ? T // special case for `null | undefined` when not in `--strictNullChecks` mode
  : T extends object & { then(onfulfilled: infer F, ...args: infer _): any } // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
  ? F extends (value: infer V, ...args: infer _) => any // if the argument to `then` is callable, extracts the first argument
    ? Awaited<V> // recursively unwrap the value
    : never // the argument to `then` was not callable
  : T // non-object or non-thenable

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
      })
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
