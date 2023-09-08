import { CKBHasher } from '@ckb-lumos/base/lib/utils'
import { bytes } from '@ckb-lumos/codec'

export default class Blake2b {
  private blake2b: CKBHasher

  constructor() {
    this.blake2b = new CKBHasher()
  }

  public update = (message: string): void => {
    const msg = message.startsWith('0x') ? message : `0x${message}`
    this.blake2b.update(bytes.bytify(msg))
  }

  public updateBuffer = (message: Buffer): void => {
    this.blake2b.update(message)
  }

  public digest = (): string => {
    return this.blake2b.digestHex()
  }

  public static digest = (message: string): string => {
    const blake2bHash = new Blake2b()
    blake2bHash.update(message)
    return blake2bHash.digest()
  }
}
