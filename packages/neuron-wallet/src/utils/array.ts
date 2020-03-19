export default class ArrayUtils {
  public static eachSlice<T>(array: T[], size: number): T[][] {
    const arr: T[][] = []
    for (let i = 0, l = array.length; i < l; i += size) {
      arr.push(array.slice(i, i + size))
    }
    return arr
  }

  public static range = (startNumber: string, endNumber: string): string[] => {
    const result = ArrayUtils.rangeForBigInt(BigInt(startNumber), BigInt(endNumber))
    return result.map(num => num.toString())
  }

  public static rangeForBigInt = (startNumber: bigint, endNumber: bigint): bigint[] => {
    const size = +(endNumber - startNumber + BigInt(1)).toString()
    return [...Array(size).keys()].map(i => BigInt(i) + startNumber)
  }

  public static async mapSeries<T, K>(array: T[], callback: (arg: T) => K): Promise<K[]> {
    const result: K[] = []
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

  public static shuffle<T>(array: T[]): T[] {
    let result = array.slice()
    let currentIndex = result.length
    let temporaryValue, randomIndex

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1

      temporaryValue = result[currentIndex]
      result[currentIndex] = result[randomIndex]
      result[randomIndex] = temporaryValue
    }

    return result
  }
}
