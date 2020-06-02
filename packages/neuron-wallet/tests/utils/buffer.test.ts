import BufferUtils from '../../src/utils/buffer'

describe('BufferUtils', () => {
  const num = BigInt('1208925819614629174706177')
  const leHex = "0x01000000000000000000010000000000"

  describe('#writeBigUInt128LE', () => {
    describe('when success', () => {
      it('converts a BigInt value to a hex string using little endian encoding', () => {
        const result = BufferUtils.writeBigUInt128LE(num)
        expect(result).toEqual(leHex)
      })
    });
    describe('when fails', () => {
      it('throws an error if the value < 0', () => {
        expect(() => {
          BufferUtils.writeBigUInt128LE(BigInt(-1))
        }).toThrowError()
      })

      it('throws an error if the value > MAX', () => {
        expect(() => {
          BufferUtils.writeBigUInt128LE(BigInt(2) ** BigInt(128))
        }).toThrowError()
      })
    });
  });

  describe('#readBigUInt128LE', () => {
    describe('when success', () => {
      it('converts a hex string in little endian encoding to a BigInt value', () => {
        const result = BufferUtils.readBigUInt128LE(leHex)
        expect(result).toEqual(num)
      })
    });
    describe('when fails', () => {
      it('throws an error if hex string does not start with 0x', () => {
        const hexWithout0x = '0100000000000000000001000000000000'
        expect(() => {
          BufferUtils.readBigUInt128LE(hexWithout0x)
        }).toThrowError()
      })
      it('throws an error if the length of hex string is less than 34', () => {
        const hexWithInvalidLength = '0x0100000000000000000001000000000'
        expect(() => {
          BufferUtils.readBigUInt128LE(hexWithInvalidLength)
        }).toThrowError()
      })
      it('throws an error if the length of hex string is greater than 34', () => {
        const hexWithInvalidLength = '0x010000000000000000000100000000000'
        expect(() => {
          BufferUtils.readBigUInt128LE(hexWithInvalidLength)
        }).toThrowError()
      })
    });
  });
})
