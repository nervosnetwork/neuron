import Blake2b from "./blake2b"

export default class MultiSign {
  multiSignScript(blake160: string) {
    // S = '0x00', R = '0x00', M = '0x01', N = '0x01'
    return '0x00000101' + blake160.slice(2)
  }

  hash(blake160: string): string {
    return Blake2b.digest(this.multiSignScript(blake160)).slice(0, 42)
  }

  since(minutes: number, currentBlockNumber: number): string {
    const epochs = parseInt((minutes / 240).toString(), 10) + currentBlockNumber
    const leftMinutes = minutes % 240
    const result = this.epochSince(BigInt(240), BigInt(leftMinutes), BigInt(epochs))
    const buf = Buffer.alloc(8)
    buf.writeBigUInt64LE(result)
    return `0x${buf.toString('hex')}`
  }

  args(blake160: string, minutes: number, currentBlockNumber: number): string {
    return this.hash(blake160) + this.since(minutes, currentBlockNumber).slice(2)
  }

  private epochSince(length: bigint, index: bigint, number: bigint): bigint {
    return (BigInt(0x20) << BigInt(56)) + (length << BigInt(40)) + (index << BigInt(24)) + number
  }
}
