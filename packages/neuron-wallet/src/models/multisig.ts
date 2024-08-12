import { MultisigPrefixError } from '../exceptions'
import SystemScriptInfo from './system-script-info'
import { since } from '@ckb-lumos/lumos'
import { bytes, Uint64LE } from '@ckb-lumos/lumos/codec'
import Blake2b, { BLAKE160_HEX_LENGTH } from './blake2b'

export interface MultisigPrefix {
  S: string
  R: string
  M: string
  N: string
}

export default class Multisig {
  // 1 epoch = 4h = 240min
  static EPOCH_MINUTES = 240

  static defaultS: string = '00'

  static serialize(blake160s: string[], r: number = 0, m: number = 1, n: number = 1) {
    const hexR = Multisig.getMultisigParamsHex(r)
    const hexM = Multisig.getMultisigParamsHex(m)
    const hexN = Multisig.getMultisigParamsHex(n)
    return `0x${Multisig.defaultS}${hexR}${hexM}${hexN}${blake160s.reduce((pre, cur) => pre + cur.slice(2), '')}`
  }

  static hash(blake160s: string[], r: number = 0, m: number = 1, n: number = 1): string {
    const serializeResult = Multisig.serialize(blake160s, r, m, n)
    return Blake2b.digest(serializeResult).slice(0, BLAKE160_HEX_LENGTH)
  }

  static since(minutes: number, headerEpoch: string): string {
    if (minutes < 0) {
      throw new Error("minutes to calculate since can't be less than 0")
    }
    const currentEpoch = since.parseEpoch(headerEpoch)
    const totalMinutes = minutes + Math.floor((currentEpoch.index / currentEpoch.length) * this.EPOCH_MINUTES)
    const leftMinutes = totalMinutes % this.EPOCH_MINUTES
    const epochs = Math.floor(totalMinutes / this.EPOCH_MINUTES) + currentEpoch.number
    const result = this.epochSince(BigInt(this.EPOCH_MINUTES), BigInt(leftMinutes), BigInt(epochs))
    return bytes.hexify(Uint64LE.pack(result))
  }

  static args(blake160: string, minutes: number, headerEpoch: string): string {
    return Multisig.hash([blake160]) + this.since(minutes, headerEpoch).slice(2)
  }

  static getMultisigScript(blake160s: string[], r: number, m: number, n: number) {
    return SystemScriptInfo.generateMultiSignScript(Multisig.hash(blake160s, r, m, n))
  }

  static parseSince(args: string): bigint {
    return Uint64LE.unpack(`0x${args.slice(BLAKE160_HEX_LENGTH)}`).toBigInt()
  }

  private static epochSince(length: bigint, index: bigint, number: bigint): bigint {
    return (BigInt(0x20) << BigInt(56)) + (length << BigInt(40)) + (index << BigInt(24)) + number
  }

  private static getMultisigParamsHex(v: number) {
    if (v < 0 || v > 255) {
      throw new MultisigPrefixError()
    }
    return v.toString(16).padStart(2, '0')
  }
}
