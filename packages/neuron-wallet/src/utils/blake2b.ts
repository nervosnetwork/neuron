import { blake2b, PERSONAL, hexToBytes } from '@nervosnetwork/ckb-sdk-utils'

export default class Blake2b {
  private blake2b: any

  constructor() {
    this.blake2b = blake2b(32, null, null, PERSONAL)
  }

  public update = (message: string): void => {
    const msg = hexToBytes(message.replace(/0x/, ''))
    this.blake2b.update(msg)
  }

  public digest = (): string => {
    return `0x${this.blake2b.digest('hex')}`
  }

  public static digest = (message: string): string => {
    const blake2bHash = new Blake2b()
    blake2bHash.update(message)
    return blake2bHash.digest()
  }
}
