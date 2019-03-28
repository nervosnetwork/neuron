export default (obj: object) => {
  const handler = {
    get: (target: Function, method: string) => {
      return function callMethod(...args: any[]) {
        const result = target.apply(null, [method, ...args])
        return result
      }
    },
  }
  return new Proxy(obj, handler)
}
