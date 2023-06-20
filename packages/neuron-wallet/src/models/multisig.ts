import { utils } from '@ckb-lumos/lumos'
import { MultisigPrefixError } from '../exceptions'
import SystemScriptInfo from './system-script-info'

export interface MultisigPrefix {
  S: string
  R: string
  M: string
  N: string
}

export default class Multisig {
  // 1 epoch = 4h = 240min
  EPOCH_MINUTES = 240

  static defaultS: string = '00'

  static serialize(blake160s: string[], r: number = 0, m: number = 1, n: number = 1) {
    const hexR = Multisig.getMultisigParamsHex(r)
    const hexM = Multisig.getMultisigParamsHex(m)
    const hexN = Multisig.getMultisigParamsHex(n)
    return `0x${Multisig.defaultS}${hexR}${hexM}${hexN}${blake160s.reduce((pre, cur) => pre + cur.slice(2), '')}`
  }

  static hash(blake160s: string[], r: number = 0, m: number = 1, n: number = 1): string {
    const serializeResult = Multisig.serialize(blake160s, r, m, n)
    return utils.ckbHash(serializeResult).slice(0, 42)
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
    return Multisig.hash([blake160]) + this.since(minutes, headerEpoch).slice(2)
  }

  static getMultisigScript(blake160s: string[], r: number, m: number, n: number) {
    return SystemScriptInfo.generateMultiSignScript(Multisig.hash(blake160s, r, m, n))
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
      number: epoch & BigInt(0xffffff),
    }
  }

  private static getMultisigParamsHex(v: number) {
    if (v < 0 || v > 255) {
      throw new MultisigPrefixError()
    }
    return v.toString(16).padStart(2, '0')
  }
}
