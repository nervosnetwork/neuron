import ArrayUtils from '../../src/utils/array'

describe('Key tests', () => {
  describe('min', () => {
    it('with empty array', () => {
      const arr: bigint[] = []
      const minValue = ArrayUtils.min(arr)
      expect(minValue).toBe(undefined)
    })

    it('only one value', () => {
      const value = BigInt(1)
      const arr = [value]
      const minValue = ArrayUtils.min(arr)
      expect(minValue).toEqual(value)
    })

    it('two value', () => {
      const arr = [BigInt(38050), BigInt(4058)]
      const minValue = ArrayUtils.min(arr)
      expect(minValue).toEqual(BigInt(4058))
    })
  })

  it('eachSlice', () => {
    const arr: number[] = [1, 2, 3, 4, 5, 6]
    const result = ArrayUtils.eachSlice(arr, 4)
    expect(result).toEqual([[1, 2, 3, 4], [5, 6]])
  })

  it('range', () => {
    const result: string[] = ArrayUtils.range('1', '5')
    expect(result).toEqual(['1', '2', '3', '4', '5'])
  })

  it('rangeForBigInt', () => {
    const result: bigint[] = ArrayUtils.rangeForBigInt(BigInt(1), BigInt(3))
    expect(result).toEqual([BigInt(1), BigInt(2), BigInt(3)])
  })

  it('mapSeries', async () => {
    const result = await ArrayUtils.mapSeries([1, 2, 3], async (num: number) => num + 1)
    expect(result).toEqual([2, 3, 4])
  })
})
