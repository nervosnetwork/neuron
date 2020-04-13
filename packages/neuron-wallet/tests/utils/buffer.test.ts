import BufferUtils from '../../src/utils/buffer'

describe('BufferUtils', () => {
  const num = BigInt('1208925819614629174706177')
  const leHex = "0x01000000000000000000010000000000"

  it('writeBigUInt128LE', () => {
    const result = BufferUtils.writeBigUInt128LE(num)
    expect(result).toEqual(leHex)
  })

  it('writeBigUInt128LE, < 0', () => {
    expect(() => {
      BufferUtils.writeBigUInt128LE(BigInt(-1))
    }).toThrowError()
  })

  it('writeBigUInt128LE, > MAX', () => {
    expect(() => {
      BufferUtils.writeBigUInt128LE(BigInt(2) ** BigInt(128))
    }).toThrowError()
  })

  it('readBigUInt128LE', () => {
    const result = BufferUtils.readBigUInt128LE(leHex)
    expect(result).toEqual(num)
  })
})
