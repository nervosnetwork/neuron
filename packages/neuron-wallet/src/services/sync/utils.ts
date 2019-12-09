export default class Utils {
  public static eachSlice = (array: any[], size: number) => {
    const arr = []
    for (let i = 0, l = array.length; i < l; i += size) {
      arr.push(array.slice(i, i + size))
    }
    return arr
  }

  public static range = (startNumber: string, endNumber: string): string[] => {
    const result = Utils.rangeForBigInt(BigInt(startNumber), BigInt(endNumber))
    return result.map(num => num.toString())
  }

  public static rangeForBigInt = (startNumber: bigint, endNumber: bigint): bigint[] => {
    const size = +(endNumber - startNumber + BigInt(1)).toString()
    return [...Array(size).keys()].map(i => BigInt(i) + startNumber)
  }

  public static sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public static async retry<T>(times: number, interval: number, callback: (...args: any[]) => T): Promise<T> {
    let retryTime = 0

    while (++retryTime < times) {
      try {
        return callback()
      } catch (err) {
        await Utils.sleep(interval)
      }
    }
    return callback()
  }

  public static mapSeries = async (array: any[], callback: any): Promise<any[]> => {
    const result = []
    for (const item of array) {
      const r = await callback(item)
      result.push(r)
    }
    return result
  }

  public static min = (array: bigint[]): bigint | undefined => {
    let minValue = array[0]
    if (!minValue) {
      return undefined
    }

    for (let i = 1; i < array.length; ++i) {
      const value = array[i]
      if (value < minValue) {
        minValue = value
      }
    }

    return minValue
  }
}
