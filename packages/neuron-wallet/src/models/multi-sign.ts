import { MultisigPrefixError } from 'exceptions'
import Blake2b from './blake2b'

export interface MultisigPrefix {
  S: string
  R: string
  M: string
  N: string
}

const defaultMultisigPrefix = {
  S: '0x00',
  R: '0x00',
  M: '0x01',
  N: '0x01'
}

export default class MultiSign {
  // 1 epoch = 4h = 240min
  EPOCH_MINUTES = 240

  static defaultS: string = '0x00'

  serialize(blake160s: string[], { S, R, M, N }: MultisigPrefix = defaultMultisigPrefix) {
    this.validateMultisigPrefix(S)
    this.validateMultisigPrefix(R)
    this.validateMultisigPrefix(M)
    this.validateMultisigPrefix(N)
    return `${S}${R.slice(2)}${M.slice(2)}${N.slice(2)}${blake160s.reduce((pre, cur) => pre + cur.slice(2), '')}`
  }

  hash(blake160: string | string[], multisigPrefix: MultisigPrefix = defaultMultisigPrefix): string {
    return Blake2b.digest(this.serialize(typeof blake160 === 'string' ? [blake160] : blake160, multisigPrefix)).slice(
      0,
      42
    )
  }

  since(minutes: number, headerEpoch: string): string {
    if (minutes < 0) {
      throw new Error("minutes to calculate since can't be less than 0")
    }
    const currentEpochInfo = this.parseEpoch(BigInt(headerEpoch))
    const totalMinutes =
      minutes +
      parseInt(
        (
          (parseInt(currentEpochInfo.index.toString()) / parseInt(currentEpochInfo.length.toString())) *
          this.EPOCH_MINUTES
        ).toString()
      )
    const leftMinutes = totalMinutes % this.EPOCH_MINUTES
    const epochs: bigint =
      BigInt(parseInt((totalMinutes / this.EPOCH_MINUTES).toString(), 10)) + currentEpochInfo.number
    const result = this.epochSince(BigInt(this.EPOCH_MINUTES), BigInt(leftMinutes), epochs)
    const buf = Buffer.alloc(8)
    buf.writeBigUInt64LE(result)
    return `0x${buf.toString('hex')}`
  }

  args(blake160: string, minutes: number, headerEpoch: string): string {
    return this.hash(blake160) + this.since(minutes, headerEpoch).slice(2)
  }

  parseSince(args: string): bigint {
    const str = args.slice(42)
    const buf = Buffer.from(str, 'hex')
    const sin: bigint = buf.readBigUInt64LE()
    return sin
  }

  private epochSince(length: bigint, index: bigint, number: bigint): bigint {
    return (BigInt(0x20) << BigInt(56)) + (length << BigInt(40)) + (index << BigInt(24)) + number
  }

  private parseEpoch(epoch: bigint) {
    return {
      length: (epoch >> BigInt(40)) & BigInt(0xffff),
      index: (epoch >> BigInt(24)) & BigInt(0xffff),
      number: epoch & BigInt(0xffffff)
    }
  }

  private validateMultisigPrefix(v: string) {
    if (!v.startsWith('0x') || v.length !== 4) {
      throw new MultisigPrefixError()
    }
  }
}
