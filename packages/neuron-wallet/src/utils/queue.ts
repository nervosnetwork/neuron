import { AsyncResultIterator, queue } from 'async'

export default function queueWrapper<T, R, E = Error>(
  fn: (item: T) => Promise<R>,
  concurrency?: number,
  ignoreSameItem?: boolean
) {
  const itemList: T[] = []
  const promiseList: Promise<R | undefined>[] = []
  const queueFn: AsyncResultIterator<T, R, E> = (item: T, callback: (err?: E | null, res?: R) => void) => {
    try {
      fn(item)
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
    asyncPush: (item: T) => {
      if (ignoreSameItem && itemList.length) {
        if (item === itemList[itemList.length - 1] && q.length()) {
          return promiseList[promiseList.length - 1]
        }
      }
      itemList.push(item)
      promiseList.push(
        new Promise<R | undefined>((resolve, reject) => {
          q.push<R>(item, (err, value) => {
            itemList.shift()
            promiseList.shift()
            if (err) {
              reject(err)
              return
            }
            resolve(value)
          })
        })
      )
      return promiseList[promiseList.length - 1]
    }
  }
}
