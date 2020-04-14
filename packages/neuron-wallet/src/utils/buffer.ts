export default class BufferUtils {
  private static U128_MAX = BigInt(2) ** BigInt(128) - BigInt(1)
  private static U128_MIN = BigInt(0)

  static writeBigUInt128LE(u128: bigint): string {
    if (u128 < this.U128_MIN) {
      throw new Error(`u128 ${u128} too small`)
    }
    if (u128 > this.U128_MAX) {
      throw new Error(`u128 ${u128} too large`)
    }
    const buf = Buffer.alloc(16)
    buf.writeBigUInt64LE(u128 & BigInt('0xFFFFFFFFFFFFFFFF'), 0)
    buf.writeBigUInt64LE(u128 >> BigInt(64), 8)
    return '0x' + buf.toString('hex')
  }

  public static readBigUInt128LE(leHex: string): bigint {
    if (leHex.length !== 34 || !leHex.startsWith('0x')) {
      throw new Error(`leHex format error`)
    }
    const buf = Buffer.from(leHex.slice(2), 'hex')
    return (buf.readBigUInt64LE(8) << BigInt(64)) + buf.readBigUInt64LE(0)
  }
}
