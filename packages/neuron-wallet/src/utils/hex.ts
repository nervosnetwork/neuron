export default class HexUtils {
  public static toDecimal(hex: string): string {
    return BigInt(hex).toString()
  }

  public static toHex(num: string | number, padStartCount: number = 0): string {
    if (typeof num === 'string' && num.startsWith('0x')) {
      return num
    }
    return `0x${(typeof num === 'string' ? BigInt(num) : num).toString(16).padStart(padStartCount, '0')}`
  }

  public static removePrefix(hex: string): string {
    if (hex.startsWith('0x')) {
      return hex.slice(2)
    }
    return hex
  }

  public static addPrefix(hex: string): string {
    if (hex.startsWith('0x')) {
      return hex
    }
    return `0x${hex}`
  }

  public static byteLength(hex: string): number {
    return Buffer.byteLength(HexUtils.removePrefix(hex), 'hex')
  }

  public static fromBuffer(buffer: Buffer): string {
    return '0x' + buffer.toString('hex')
  }
}
