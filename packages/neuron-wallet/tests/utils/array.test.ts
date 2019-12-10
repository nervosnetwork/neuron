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
})
