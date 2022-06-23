import { AsyncResultIterator, queue } from 'async'

export default function queueWrapper<T, R, E = Error>(fn: (item: T) => R, concurrency?: number) {
  const queueFn: AsyncResultIterator<T, R, E> = (item: T, callback: (err?: E | null, res?: R) => void) => {
    try {
      const res = Promise.resolve(fn(item))
      res
        .then((v: R) => {
          callback(null, v)
        })
        .catch((err: E) => {
          callback(err)
        })
    } catch (error) {
      callback(error)
    }
  }
  const q = queue<T, R, E>(queueFn, concurrency)
  return {
    ...q,
    asyncPush: (item: T | T[]) => {
      return new Promise<R | undefined>((resolve, reject) => {
        q.push<R>(item, (err, value) => {
          if (err) {
            reject(err)
          }
          resolve(value)
        })
      })
    }
  }
}
